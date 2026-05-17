{
  description = "Sith - OpenCode Docker Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Load packages from config
        packagesConfig = builtins.fromJSON (builtins.readFile ./nix-config/packages.json);

        allPackages = pkgs.lib.flatten (
          pkgs.lib.mapAttrsToList (category: config: config.packages) packagesConfig.categories
        );

        resolvePkg = pkgPath:
          let
            parts = pkgs.lib.splitString "." pkgPath;
          in
            if pkgs.lib.length parts == 1
            then builtins.getAttr (pkgs.lib.head parts) pkgs
            else if pkgs.lib.length parts == 2
            then builtins.getAttr (pkgs.lib.elemAt parts 1) (builtins.getAttr (pkgs.lib.head parts) pkgs)
            else throw "Package path too deep: ${pkgPath}";

        packages = map resolvePkg allPackages;
      in
      {
        devShells.default = pkgs.mkShell {
          name = "opencode-ci-environment";

          buildInputs = packages;

          shellHook = ''
            # Source external setup script
            if [ -f /opt/sith/nix/nix-scripts/setup.sh ]; then
              source /opt/sith/nix/nix-scripts/setup.sh
            fi
          '';

          LOCALE_ARCHIVE = "${pkgs.glibcLocales}/lib/locale/locale-archive";
          LANG = "en_US.UTF-8";
          LC_ALL = "en_US.UTF-8";
          LC_CTYPE = "en_US.UTF-8";

          SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
          NIX_SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
        };
      }
    );
}
