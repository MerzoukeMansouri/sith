# Nix package list generator
# Reads packages.json and generates a list for buildInputs

{ pkgs, lib }:

let
  # Load packages configuration
  packagesConfig = builtins.fromJSON (builtins.readFile ./packages.json);
  
  # Extract all packages from all categories
  allPackages = lib.flatten (
    lib.mapAttrsToList (category: config: config.packages) packagesConfig.categories
  );
  
  # Convert package strings to actual Nix packages
  # Handle nested packages like "python3Packages.pip"
  resolvePkg = pkgPath:
    let
      parts = lib.splitString "." pkgPath;
    in
      if lib.length parts == 1
      then builtins.getAttr (lib.head parts) pkgs
      else if lib.length parts == 2
      then builtins.getAttr (lib.elemAt parts 1) (builtins.getAttr (lib.head parts) pkgs)
      else throw "Package path too deep: ${pkgPath}";
  
in
  map resolvePkg allPackages
