{ pkgs ? import <nixpkgs> {
    overlays = [
      # (import (builtins.fetchTarball "https://github.com/oxalica/rust-overlay/archive/master.tar.gz"))
    ];
  }
}:

pkgs.mkShell {
  buildInputs = [
    # Node.js and pnpm for web development
    pkgs.nodejs
    pkgs.nodePackages.pnpm
  ];

  shellHook = ''
    echo "Node.js development shell loaded."
    echo "Node.js version: $(node --version)"
    echo "pnpm version: $(pnpm --version)"
  '';
}
