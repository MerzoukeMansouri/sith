# OpenCode Docker - Nix Shell Environment
# Environnement reproductible pour CI/CD
#
# Usage:
#   - Dans Docker: automatiquement chargé par le Dockerfile
#   - En local: nix-shell (si Nix est installé)

{ pkgs ? import (fetchTarball {
    # Pin nixpkgs à une version stable spécifique pour reproductibilité
    url = "https://github.com/NixOS/nixpkgs/archive/nixos-23.11.tar.gz";
    sha256 = "1f5d2g1p6nfwycpmrnnmc2xmcszp804adp16knjvdkj8nz36y1fg";
  }) {}
}:

let
  # Load packages from external configuration
  packages = import ./nix-config/packages.nix { inherit pkgs; lib = pkgs.lib; };
in

pkgs.mkShell {
  name = "sith-environment";
  
  # Packages loaded from nix-config/packages.json
  buildInputs = packages;
  
  # Variables d'environnement
  shellHook = ''
    # Source external setup script (not bash, so exports persist)
    if [ -f /opt/sith/nix/nix-scripts/setup.sh ]; then
      source /opt/sith/nix/nix-scripts/setup.sh
    else
      echo "⚠️  Setup scripts not found in /opt/sith/nix/nix-scripts/"
    fi
  '';
  
  # Variables d'environnement persistantes
  LOCALE_ARCHIVE = "${pkgs.glibcLocales}/lib/locale/locale-archive";
  LANG = "en_US.UTF-8";
  LC_ALL = "en_US.UTF-8";
  LC_CTYPE = "en_US.UTF-8";
  
  # SSL Certificates
  SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
  NIX_SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
}
