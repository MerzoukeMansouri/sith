export interface MenuItem {
  label: string;
  value: string;
  icon: string;
}

export interface BuildingSpinnerProps {
  step: string;
}

export interface DockerCommandOptions {
  build?: boolean;
  pull?: boolean;
}