import { createFileRoute } from '@tanstack/react-router';
import { LuGithub, LuHeart } from 'react-icons/lu';

import { ProtocolAgendaUpcoming } from '@/components/agenda/Upcoming';
import { TopicList } from '@/components/topic/TopicList';
import { TopicsTrending } from '@/components/topic/TopicsTrending';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div className="right-bar p-4">
        <ProtocolAgendaUpcoming />
      </div>
      <div className="mx-auto w-full max-w-screen-lg pt-8 px-2 space-y-4">
        <div className="space-y-4 mx-auto">
          <div className="card flex-1 flex flex-col gap-1 h-fit col-span-full w-full">
            <h1 className="">Welcome to Ethereum Forum!</h1>
            <p className="text-secondary">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.
            </p>
          </div>
          <TopicsTrending />
          <TopicList />
        </div>
        <div className="w-full flex items-center justify-center text-secondary gap-4 text-sm">
          <div className="flex items-center gap-1">
            Made with <LuHeart className="size-4" /> by{' '}
            <a
              href="https://v3x.company"
              className="text-secondary"
              target="_blank"
              rel="noreferrer"
            >
              v3xlabs
            </a>
          </div>
          <a
            href="https://github.com/v3xlabs/ethereum-forum"
            className="hover:text-secondary transition-colors flex items-center gap-1"
            target="_blank"
            rel="noreferrer"
          >
            <LuGithub className="size-4" />
            <span>Contribute</span>
          </a>
        </div>
      </div>
    </>
  );
}
