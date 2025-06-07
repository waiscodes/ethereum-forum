use async_std::task;
use futures::{Stream, StreamExt, stream};
use async_openai::{
    types::{ChatCompletionRequestMessage, CreateChatCompletionRequest, ChatCompletionTool,
        ChatCompletionRequestAssistantMessage, ChatCompletionRequestToolMessage,
        ChatCompletionRequestAssistantMessageContent, ChatCompletionMessageToolCall,
        ChatCompletionToolType, FunctionCall},
};
use std::collections::{VecDeque, HashMap};
use std::sync::Arc;
use async_std::sync::{RwLock, Mutex};
use async_std::channel::{unbounded, Sender};
use tracing;
use serde::{Serialize, Deserialize};
use serde_json::Value;

use crate::state::AppState;

/// Helper function to normalize tool arguments by converting string numbers to actual numbers
/// for known numeric parameters
fn normalize_tool_arguments(tool_name: &str, args: Value) -> Value {
    let mut normalized_args = args;
    
    // List of tools and their numeric parameters that should be converted from strings to numbers
    let numeric_params = match tool_name {
        "get_topic_summary" => vec!["topic_id"],
        "get_posts" => vec!["page", "size", "topic_id"],
        "search_forum" => vec!["limit", "offset"],
        "search_topics" => vec!["limit", "offset"],
        "search_posts" => vec!["limit", "offset"],
        "search_posts_in_topic" => vec!["limit", "offset", "topic_id"],
        "search_by_user" => vec!["limit", "offset", "user_id"],
        "search_by_username" => vec!["limit", "offset"],
        "search_by_username_mention" => vec!["limit", "offset"],
        "username_to_user_id" => vec![],
        "get_user_profile" => vec![],
        "get_user_summary" => vec![],
        _ => vec![], // For unknown tools, don't convert anything
    };
    
    if let Value::Object(ref mut map) = normalized_args {
        // Collect updates to apply later to avoid borrowing conflicts
        let mut updates = Vec::new();
        
        for param in numeric_params {
            if let Some(value) = map.get(param) {
                match value {
                    Value::String(s) => {
                        // Try to parse as integer first, then as float
                        if let Ok(int_val) = s.parse::<i64>() {
                            updates.push((param.to_string(), Value::Number(serde_json::Number::from(int_val))));
                            tracing::debug!("🔢 Converted parameter '{}' from string '{}' to number {}", param, s, int_val);
                        } else if let Ok(float_val) = s.parse::<f64>() {
                            if let Some(num) = serde_json::Number::from_f64(float_val) {
                                updates.push((param.to_string(), Value::Number(num)));
                                tracing::debug!("🔢 Converted parameter '{}' from string '{}' to number {}", param, s, float_val);
                            }
                        }
                    }
                    _ => {
                        // Value is already a number or other type, leave it as is
                    }
                }
            }
        }
        
        // Apply the updates
        for (key, value) in updates {
            map.insert(key, value);
        }
    }
    
    normalized_args
}

pub const SUMMARY_PROMPT: &str = include_str!("./summary.md");
pub const SUMMARY_MODEL: &str = "mistralai/ministral-3b";

pub const WORKSHOP_PROMPT: &str = include_str!("./workshop.md");
pub const WORKSHOP_MODEL: &str = "google/gemini-2.5-pro-preview";

pub const SHORTSUM_PROMPT: &str = include_str!("./shortsum.md");
pub const SHORTSUM_MODEL: &str = "mistralai/mistral-7b-instruct:free";

/// Enhanced state for streaming with tool call support
#[derive(Clone)]
pub struct OngoingPromptState {
    pub buffer: Arc<RwLock<VecDeque<StreamingEntry>>>,
    pub senders: Arc<Mutex<Vec<Sender<Result<StreamingEntry, String>>>>>,
    pub is_complete: Arc<RwLock<bool>>,
    pub error: Arc<RwLock<Option<String>>>,
    pub final_content: Arc<RwLock<Option<String>>>,
    pub conversation_history: Arc<RwLock<Vec<ChatCompletionRequestMessage>>>,
    pub tools: Arc<RwLock<Option<Vec<ChatCompletionTool>>>>,
}

/// Streaming entry types to support different kinds of streaming content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingEntry {
    pub content: String,
    #[serde(rename = "type")]
    pub entry_type: StreamingEntryType,
    pub tool_call: Option<ToolCallEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StreamingEntryType {
    Content,
    ToolCallStart,
    ToolCallResult,
    ToolCallError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallEntry {
    pub tool_name: String,
    pub tool_id: String,
    pub arguments: Option<String>,
    pub result: Option<String>,
    pub status: ToolCallStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolCallStatus {
    Starting,
    Executing,
    Success,
    Error,
}

/// Enhanced OngoingPrompt with tool calling support
#[derive(Clone)]
pub struct OngoingPrompt {
    pub state: OngoingPromptState,
}

impl OngoingPrompt {
    pub async fn new(state: &AppState, messages: Vec<ChatCompletionRequestMessage>, tools: Option<Vec<ChatCompletionTool>>) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!("🚀 Creating new OngoingPrompt with {} messages and {} tools", 
            messages.len(), tools.as_ref().map(|t| t.len()).unwrap_or(0));
        
        let model = WORKSHOP_MODEL.to_string();
        
        tracing::info!("📡 API Request Details:");
        tracing::info!("  Model: {}", model);
        tracing::info!("  Messages count: {}", messages.len());
        tracing::info!("  Tools count: {}", tools.as_ref().map(|t| t.len()).unwrap_or(0));
        tracing::info!("  Stream: true");
        
        // Debug log the tools being sent to identify potential issues
        if let Some(ref tools_list) = tools {
            tracing::info!("🔧 Tools being sent to LLM:");
            for (idx, tool) in tools_list.iter().enumerate() {
                tracing::info!("  Tool {}: {} - {:?}", 
                    idx + 1, 
                    &tool.function.name, 
                    &tool.function.description
                );
                
                // Log tool parameters schema (truncated for readability)
                if let Some(ref params) = tool.function.parameters {
                    let params_str = serde_json::to_string_pretty(params)
                        .unwrap_or_else(|_| "Failed to serialize".to_string());
                    let truncated = if params_str.len() > 500 {
                        format!("{}... [truncated]", &params_str[..500])
                    } else {
                        params_str
                    };
                    tracing::info!("    Parameters: {}", truncated);
                } else {
                    tracing::info!("    Parameters: None");
                }
            }
        }
        
        // Log first few characters of first message for debugging
        if let Some(first_msg) = messages.first() {
            match first_msg {
                ChatCompletionRequestMessage::System(sys_msg) => {
                    tracing::info!("  First message (System): {}...", 
                        match &sys_msg.content {
                            async_openai::types::ChatCompletionRequestSystemMessageContent::Text(text) => 
                                text.chars().take(100).collect::<String>(),
                            _ => "[Complex content]".to_string(),
                        }
                    );
                },
                ChatCompletionRequestMessage::User(user_msg) => {
                    tracing::info!("  First message (User): {}...", 
                        match &user_msg.content {
                            async_openai::types::ChatCompletionRequestUserMessageContent::Text(text) => 
                                text.chars().take(100).collect::<String>(),
                            _ => "[Complex content]".to_string(),
                        }
                    );
                },
                _ => tracing::info!("  First message: [Other type]"),
            }
        }
        
        let buffer = Arc::new(RwLock::new(VecDeque::new()));
        let senders = Arc::new(Mutex::new(Vec::new()));
        let is_complete = Arc::new(RwLock::new(false));
        let error = Arc::new(RwLock::new(None));
        let final_content = Arc::new(RwLock::new(None));
        let conversation_history = Arc::new(RwLock::new(messages.clone()));
        let tools_arc = Arc::new(RwLock::new(tools.clone()));
        
        let ongoing_state = OngoingPromptState {
            buffer: buffer.clone(),
            senders: senders.clone(),
            is_complete: is_complete.clone(),
            error: error.clone(),
            final_content: final_content.clone(),
            conversation_history: conversation_history.clone(),
            tools: tools_arc.clone(),
        };

        // Clone everything needed for the background task
        let state_clone = state.clone();
        let buffer_clone = buffer.clone();
        let senders_clone = senders.clone();
        let is_complete_clone = is_complete.clone();
        let error_clone = error.clone();
        let final_content_clone = final_content.clone();
        let conversation_history_clone = conversation_history.clone();
        let tools_clone = tools_arc.clone();
        
        task::spawn(async move {
            let mut accumulated_content = String::new();
            let mut conversation_complete = false;
            let mut completion_error: Option<String> = None;

            tracing::info!("🔄 Starting enhanced stream processing with tool call support...");
            
            while !conversation_complete && completion_error.is_none() {
                // Get current conversation state
                let current_messages = {
                    let history = conversation_history_clone.read().await;
                    history.clone()
                };
                
                let current_tools = {
                    let tools_lock = tools_clone.read().await;
                    tools_lock.clone()
                };

                // Create request for this iteration
                let request = CreateChatCompletionRequest {
                    model: WORKSHOP_MODEL.to_string(),
                    messages: current_messages,
                    tools: current_tools,
                    tool_choice: None,
                    stream: Some(true),
                    ..Default::default()
                };

                tracing::info!("📞 Making API call for conversation turn...");
                let mut stream = match state_clone.workshop.client
                    .chat()
                    .create_stream(request)
                    .await
                {
                    Ok(stream) => stream,
                    Err(e) => {
                        tracing::error!("❌ Failed to create chat completion stream: {:?}", e);
                        completion_error = Some(e.to_string());
                        break;
                    }
                };

                let mut turn_content = String::new();
                let mut tool_calls: Vec<ChatCompletionMessageToolCall> = Vec::new();
                let mut current_tool_call: Option<ChatCompletionMessageToolCall> = None;
                let mut chunk_count = 0;

                // Process the stream for this conversation turn
                while let Some(result) = stream.next().await {
                    chunk_count += 1;
                    
                    match result {
                        Ok(chunk) => {
                            // tracing::debug!("📦 Received chunk #{}: {:?}", chunk_count, chunk);
                            
                            for choice in &chunk.choices {
                                // Handle content
                                if let Some(content) = &choice.delta.content {
                                    if !content.is_empty() {
                                        tracing::debug!("📝 Content from chunk #{}: '{}'", chunk_count, content);
                                        
                                        // Buffer the content
                                        {
                                            let mut buffer = buffer_clone.write().await;
                                            buffer.push_back(StreamingEntry {
                                                content: content.clone(),
                                                entry_type: StreamingEntryType::Content,
                                                tool_call: None,
                                            });
                                        }
                                        
                                        // Broadcast to all active streams
                                        {
                                            let mut senders_lock = senders_clone.lock().await;
                                            senders_lock.retain(|sender| {
                                                sender.try_send(Ok(StreamingEntry {
                                                    content: content.clone(),
                                                    entry_type: StreamingEntryType::Content,
                                                    tool_call: None,
                                                })).is_ok()
                                            });
                                        }
                                        
                                        turn_content.push_str(content);
                                        accumulated_content.push_str(content);
                                    }
                                }

                                // Handle tool calls
                                if let Some(ref tool_calls_chunk) = choice.delta.tool_calls {
                                    tracing::info!("🔧 TOOL CALL DETECTED in chunk #{}", chunk_count);
                                    for tool_call_chunk in tool_calls_chunk {
                                        if let Some(id) = &tool_call_chunk.id {
                                            // Start of a new tool call
                                            if let Some(completed_call) = current_tool_call.take() {
                                                tracing::info!("📋 COMPLETED TOOL CALL: {} with args: {}", 
                                                    completed_call.function.name, completed_call.function.arguments);
                                                tool_calls.push(completed_call);
                                            }
                                            
                                            tracing::info!("🆕 NEW TOOL CALL STARTED: ID={}", id);
                                            current_tool_call = Some(ChatCompletionMessageToolCall {
                                                id: id.clone(),
                                                r#type: ChatCompletionToolType::Function,
                                                function: FunctionCall {
                                                    name: String::new(),
                                                    arguments: String::new(),
                                                },
                                            });
                                        }
                                        
                                        if let Some(ref mut call) = current_tool_call {
                                            if let Some(ref function) = tool_call_chunk.function {
                                                if let Some(ref name) = function.name {
                                                    call.function.name.push_str(name);
                                                    tracing::debug!("🔧 Tool name fragment: '{}'", name);
                                                }
                                                if let Some(ref args) = function.arguments {
                                                    call.function.arguments.push_str(args);
                                                    tracing::debug!("📝 Tool args fragment: '{}'", args);
                                                }
                                            }
                                        }
                                    }
                                }

                                // Check for finish reason
                                if let Some(finish_reason) = &choice.finish_reason {
                                    tracing::info!("🏁 Turn finished with reason: {:?}", finish_reason);
                                    
                                    // Add any remaining tool call
                                    if let Some(completed_call) = current_tool_call.take() {
                                        tracing::info!("📋 FINAL TOOL CALL: {} with args: {}", 
                                            completed_call.function.name, completed_call.function.arguments);
                                        tool_calls.push(completed_call);
                                    }
                                    break;
                                }
                            }
                        }
                        Err(e) => {
                            tracing::error!("❌ Stream error on chunk #{}: {}", chunk_count, e);
                            
                            // Check if this is a tool call parsing error and we have a partial tool call
                            if e.to_string().contains("unknown variant") && e.to_string().contains("expected `function`") {
                                tracing::warn!("🔧 Detected malformed tool call response, attempting recovery...");
                                
                                // If we have a current tool call in progress, try to complete it
                                if let Some(completed_call) = current_tool_call.take() {
                                    if !completed_call.function.name.is_empty() {
                                        tracing::info!("🔄 RECOVERING TOOL CALL: {} with args: {}", 
                                            completed_call.function.name, completed_call.function.arguments);
                                        tool_calls.push(completed_call);
                                        
                                        // Continue to tool execution instead of erroring out
                                        break;
                                    }
                                }
                            }
                            
                            completion_error = Some(e.to_string());
                            break;
                        }
                    }
                }

                // Process any tool calls that were made
                if !tool_calls.is_empty() {
                    tracing::info!("🟡🟡🟡 TOOL EXECUTION PHASE STARTING 🟡🟡🟡");
                    tracing::info!("🔧 Processing {} tool call(s)", tool_calls.len());
                    
                    // Add assistant message with tool calls to conversation
                    {
                        let mut history = conversation_history_clone.write().await;
                        history.push(ChatCompletionRequestMessage::Assistant(
                            ChatCompletionRequestAssistantMessage {
                                content: if turn_content.is_empty() { 
                                    None 
                                } else { 
                                    Some(ChatCompletionRequestAssistantMessageContent::Text(turn_content.clone()))
                                },
                                refusal: None,
                                name: None,
                                tool_calls: Some(tool_calls.clone()),
                                function_call: None,
                                audio: None,
                            }
                        ));
                        tracing::info!("💾 Added assistant message with {} tool calls to conversation", tool_calls.len());
                    }

                    // Execute each tool call
                    for (index, tool_call) in tool_calls.iter().enumerate() {
                        let tool_name = &tool_call.function.name;
                        let tool_args = &tool_call.function.arguments;
                        
                        tracing::info!("🟢🟢🟢 EXECUTING TOOL #{}/{} 🟢🟢🟢", index + 1, tool_calls.len());
                        tracing::info!("🛠️  Tool: {}", tool_name);
                        tracing::info!("📋 Args: {}", tool_args);
                        tracing::info!("🆔 Call ID: {}", tool_call.id);
                        
                        // Stream tool call start to user
                        let tool_start_entry = StreamingEntry {
                            content: String::new(),
                            entry_type: StreamingEntryType::ToolCallStart,
                            tool_call: Some(ToolCallEntry {
                                tool_name: tool_name.clone(),
                                tool_id: tool_call.id.clone(),
                                arguments: Some(tool_args.clone()),
                                result: None,
                                status: ToolCallStatus::Starting,
                            }),
                        };
                        
                        {
                            let mut buffer = buffer_clone.write().await;
                            buffer.push_back(tool_start_entry.clone());
                        }
                        {
                            let mut senders_lock = senders_clone.lock().await;
                            senders_lock.retain(|sender| {
                                sender.try_send(Ok(tool_start_entry.clone())).is_ok()
                            });
                        }

                        // Parse arguments and call the tool
                        let tool_result = match serde_json::from_str(tool_args) {
                            Ok(mut args_json) => {
                                tracing::info!("✅ Tool arguments parsed successfully");
                                
                                // Normalize numeric arguments (convert string numbers to actual numbers)
                                args_json = normalize_tool_arguments(tool_name, args_json);
                                tracing::info!("🔢 Tool arguments after normalization: {}", args_json);
                                
                                // Send executing status
                                let executing_entry = StreamingEntry {
                                    content: String::new(),
                                    entry_type: StreamingEntryType::ToolCallStart,
                                    tool_call: Some(ToolCallEntry {
                                        tool_name: tool_name.clone(),
                                        tool_id: tool_call.id.clone(),
                                        arguments: Some(tool_args.clone()),
                                        result: None,
                                        status: ToolCallStatus::Executing,
                                    }),
                                };
                                
                                {
                                    let mut buffer = buffer_clone.write().await;
                                    buffer.push_back(executing_entry.clone());
                                }
                                {
                                    let mut senders_lock = senders_clone.lock().await;
                                    senders_lock.retain(|sender| {
                                        sender.try_send(Ok(executing_entry.clone())).is_ok()
                                    });
                                }
                                
                                match state_clone.workshop.mcp_client.write().await.call_tool(tool_name, args_json).await {
                                    Ok(response) => {
                                        let content: String = response.content
                                            .into_iter()
                                            .filter_map(|c| c.text)
                                            .collect::<Vec<_>>()
                                            .join("\n");
                                        
                                        tracing::info!("✅ TOOL EXECUTION SUCCESS: {}", tool_name);
                                        tracing::info!("📤 Tool result length: {} characters", content.len());
                                        tracing::info!("📄 Tool result preview: {}...", 
                                            content.chars().take(200).collect::<String>());
                                        
                                        // Send success result
                                        let success_entry = StreamingEntry {
                                            content: String::new(),
                                            entry_type: StreamingEntryType::ToolCallResult,
                                            tool_call: Some(ToolCallEntry {
                                                tool_name: tool_name.clone(),
                                                tool_id: tool_call.id.clone(),
                                                arguments: Some(tool_args.clone()),
                                                result: Some(content.clone()),
                                                status: ToolCallStatus::Success,
                                            }),
                                        };
                                        
                                        {
                                            let mut buffer = buffer_clone.write().await;
                                            buffer.push_back(success_entry.clone());
                                        }
                                        {
                                            let mut senders_lock = senders_clone.lock().await;
                                            senders_lock.retain(|sender| {
                                                sender.try_send(Ok(success_entry.clone())).is_ok()
                                            });
                                        }
                                        
                                        content
                                    }
                                    Err(e) => {
                                        tracing::error!("❌ TOOL EXECUTION FAILED: {} - Error: {}", tool_name, e);
                                        let error_msg = format!("Error executing tool {}: {}", tool_name, e);
                                        
                                        // Send error result
                                        let error_entry = StreamingEntry {
                                            content: String::new(),
                                            entry_type: StreamingEntryType::ToolCallError,
                                            tool_call: Some(ToolCallEntry {
                                                tool_name: tool_name.clone(),
                                                tool_id: tool_call.id.clone(),
                                                arguments: Some(tool_args.clone()),
                                                result: Some(error_msg.clone()),
                                                status: ToolCallStatus::Error,
                                            }),
                                        };
                                        
                                        {
                                            let mut buffer = buffer_clone.write().await;
                                            buffer.push_back(error_entry.clone());
                                        }
                                        {
                                            let mut senders_lock = senders_clone.lock().await;
                                            senders_lock.retain(|sender| {
                                                sender.try_send(Ok(error_entry.clone())).is_ok()
                                            });
                                        }
                                        
                                        error_msg
                                    }
                                }
                            }
                            Err(e) => {
                                tracing::error!("❌ TOOL ARGS PARSE FAILED: {}", e);
                                let error_msg = format!("Error parsing tool arguments: {}", e);
                                
                                // Send parse error
                                let error_entry = StreamingEntry {
                                    content: String::new(),
                                    entry_type: StreamingEntryType::ToolCallError,
                                    tool_call: Some(ToolCallEntry {
                                        tool_name: tool_name.clone(),
                                        tool_id: tool_call.id.clone(),
                                        arguments: Some(tool_args.clone()),
                                        result: Some(error_msg.clone()),
                                        status: ToolCallStatus::Error,
                                    }),
                                };
                                
                                {
                                    let mut buffer = buffer_clone.write().await;
                                    buffer.push_back(error_entry.clone());
                                }
                                {
                                    let mut senders_lock = senders_clone.lock().await;
                                    senders_lock.retain(|sender| {
                                        sender.try_send(Ok(error_entry.clone())).is_ok()
                                    });
                                }
                                
                                error_msg
                            }
                        };

                        // Add tool result to conversation
                        {
                            let mut history = conversation_history_clone.write().await;
                            history.push(ChatCompletionRequestMessage::Tool(
                                ChatCompletionRequestToolMessage {
                                    content: async_openai::types::ChatCompletionRequestToolMessageContent::Text(tool_result.clone()),
                                    tool_call_id: tool_call.id.clone(),
                                }
                            ));
                            tracing::info!("💾 Added tool result to conversation for call ID: {}", tool_call.id);
                        }
                        
                        tracing::info!("🟢🟢🟢 TOOL #{}/{} COMPLETED 🟢🟢🟢", index + 1, tool_calls.len());
                    }
                    
                    tracing::info!("🟡🟡🟡 ALL TOOLS EXECUTED - CONTINUING CONVERSATION 🟡🟡🟡");
                    // Continue the conversation with tool results
                    continue;
                } else {
                    // No tool calls, conversation is complete
                    tracing::info!("🔚 No tool calls detected - conversation complete");
                    conversation_complete = true;
                }
            }

            tracing::info!("🏁 Enhanced stream processing finished. Final content length: {}", accumulated_content.len());

            // Store final content
            {
                let mut final_content_lock = final_content_clone.write().await;
                *final_content_lock = Some(accumulated_content.clone());
                tracing::info!("💾 Stored final content: {} characters", accumulated_content.len());
            }

            // Store any error that occurred
            if let Some(err) = completion_error.clone() {
                let mut error_lock = error_clone.write().await;
                *error_lock = Some(err.clone());
                tracing::error!("💾 Stored error: {}", err);
            }

            // Mark as complete and close all senders
            {
                let mut complete = is_complete_clone.write().await;
                *complete = true;
                tracing::info!("✅ Marked prompt as complete");
            }
            
            // Close all remaining senders
            {
                let mut senders_lock = senders_clone.lock().await;
                let sender_count = senders_lock.len();
                senders_lock.clear();
                tracing::info!("📡 Closed {} remaining senders", sender_count);
            }

            if let Some(error) = completion_error {
                tracing::error!("❌ Enhanced chat completion finished with error: \"{}\"", error);
            } else {
                tracing::info!("✅ Enhanced chat completion finished successfully with data: \"{}\"", &accumulated_content[..accumulated_content.len().min(100)]);
            }
        });
            
        Ok(Self { 
            state: ongoing_state,
        })
    }
    
    /// Get a stream that starts from the beginning and includes all buffered chunks
    /// followed by any new chunks that arrive
    pub async fn get_stream(&self) -> impl Stream<Item = Result<StreamingEntry, String>> + Send + 'static {
        let buffer = self.state.buffer.clone();
        let senders = self.state.senders.clone();
        let is_complete = self.state.is_complete.clone();
        let error = self.state.error.clone();
        
        // Create a channel for this stream
        let (sender, receiver) = unbounded();
        
        // Add sender to the list
        {
            let mut senders_lock = senders.lock().await;
            senders_lock.push(sender);
        }
        
        // Create the stream
        let buffered_chunks = {
            let buffer_read = buffer.read().await;
            buffer_read.iter().cloned().collect::<Vec<_>>()
        };
        
        // Check if we have an error
        let current_error = {
            let error_read = error.read().await;
            error_read.clone()
        };
        
        // Check if complete
        let currently_complete = {
            let complete_read = is_complete.read().await;
            *complete_read
        };
        
        // Create the stream that first yields buffered chunks, then live chunks
        stream::iter(buffered_chunks.into_iter().map(Ok))
            .chain(
                if let Some(err) = current_error {
                    // If there's an error, yield it
                    stream::once(async { Err(err) }).boxed()
                } else if currently_complete {
                    // If complete, no more chunks
                    stream::empty().boxed()
                } else {
                    // Otherwise, yield from receiver
                    receiver.boxed()
                }
            )
    }
    
    /// Check if the prompt is complete
    pub async fn is_complete(&self) -> bool {
        *self.state.is_complete.read().await
    }
    
    /// Get any error that occurred
    pub async fn get_error(&self) -> Option<String> {
        self.state.error.read().await.clone()
    }
    
    /// Wait for the prompt to complete and return the final content
    pub async fn await_completion(&self) -> Result<String, String> {
        loop {
            {
                let is_complete = self.state.is_complete.read().await;
                if *is_complete {
                    break;
                }
            }
            
            // Small delay to avoid busy waiting
            task::sleep(std::time::Duration::from_millis(100)).await;
        }
        
        // Check for errors first
        if let Some(error) = self.get_error().await {
            return Err(error);
        }
        
        // Return final content
        let final_content = self.state.final_content.read().await;
        match final_content.as_ref() {
            Some(content) => Ok(content.clone()),
            None => Err("No content available".to_string()),
        }
    }

    /// Get all streaming events that were collected during completion
    pub async fn get_all_events(&self) -> Vec<StreamingEntry> {
        let buffer = self.state.buffer.read().await;
        buffer.iter().cloned().collect()
    }
}

/// Manager for ongoing prompts with request coalescing
pub struct OngoingPromptManager {
    prompts: Arc<RwLock<HashMap<String, OngoingPrompt>>>,
}

impl Default for OngoingPromptManager {
    fn default() -> Self {
        Self::new()
    }
}

impl OngoingPromptManager {
    pub fn new() -> Self {
        Self {
            prompts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get an existing prompt or create a new one with request coalescing
    /// If a prompt with the same key already exists, return the existing one
    /// Otherwise, create a new prompt and store it
    pub async fn get_or_create(
        &self,
        key: String,
        state: &AppState,
        messages: Vec<ChatCompletionRequestMessage>,
        tools: Option<Vec<ChatCompletionTool>>,
    ) -> Result<OngoingPrompt, Box<dyn std::error::Error + Send + Sync>> {
        // First check if we already have this prompt
        {
            let prompts = self.prompts.read().await;
            if let Some(existing) = prompts.get(&key) {
                tracing::info!("🔄 Returning existing prompt for key: {} (tools provided: {})", 
                    key, tools.as_ref().map(|t| t.len()).unwrap_or(0));
                return Ok(existing.clone());
            }
        }

        // Create new prompt
        tracing::info!("🆕 Creating new prompt for key: {} (tools provided: {})", 
            key, tools.as_ref().map(|t| t.len()).unwrap_or(0));
        let prompt = OngoingPrompt::new(state, messages, tools).await?;
        
        // Store it
        {
            let mut prompts = self.prompts.write().await;
            prompts.insert(key.clone(), prompt.clone());
        }
        
        tracing::info!("Stored ongoing prompt with key: {}", key);
        Ok(prompt)
    }

    /// Get an existing prompt
    pub async fn get(&self, key: &str) -> Option<OngoingPrompt> {
        let prompts = self.prompts.read().await;
        prompts.get(key).cloned()
    }

    /// List all prompt keys (for debugging)
    pub async fn list_keys(&self) -> Vec<String> {
        let prompts = self.prompts.read().await;
        prompts.keys().cloned().collect()
    }

    /// Remove a prompt
    pub async fn remove(&self, key: &str) -> Option<OngoingPrompt> {
        let mut prompts = self.prompts.write().await;
        prompts.remove(key)
    }

    /// Insert a prompt with an additional key (for system message access)
    pub async fn insert_additional_key(&self, key: String, prompt: OngoingPrompt) {
        let mut prompts = self.prompts.write().await;
        prompts.insert(key, prompt);
    }
}
