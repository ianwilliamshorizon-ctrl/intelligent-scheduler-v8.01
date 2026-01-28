{ pkgs, ... }: {
  channel = "stable-23.11"; 

  packages = [
    pkgs.nodejs_20
    pkgs.firebase-tools
    pkgs.jdk17
    pkgs.psmisc 
  ];

  idx = {
    extensions = [ "mtxr.sqltools" ];

    previews = {
      enable = false; # Turn this off to stop the automatic manager loop
    };

    workspace = {
      onStart = {
        cleanup = "fuser -k 9001/tcp 8080/tcp 9099/tcp 9199/tcp || true";
      };
    };
  };
}