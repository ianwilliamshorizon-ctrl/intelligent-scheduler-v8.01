{pkgs}: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.jdk20
    pkgs.firebase-tools
  ];

  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
  ];

  # This section ensures the IDE unlocks the ports for your App and Emulators
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "9001"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
      emulators = {
        command = [
          "firebase",
          "emulators:start"
        ];
        manager = "web";
      };
    };
  };

  # This forces the Cloud Workstation to open the Emulator doors
  idx.workspace.onCreate = {
    # Optional: You can add setup commands here if needed
  };
  
  # Ensure the environment knows about the Firebase ports
  idx.workspace.onStart = {
    # This helps the IDE "detect" the background emulator processes
  };
}