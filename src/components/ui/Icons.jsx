function Icon({ children, className = 'size-5', strokeWidth = 1.8 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function LogoIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4.5 9A8 8 0 0 1 17.7 5.3L20 7.5" />
      <path d="M20 3.5v4h-4" />
      <path d="M19.5 15a8 8 0 0 1-13.2 3.7L4 16.5" />
      <path d="M4 20.5v-4h4" />
    </Icon>
  )
}

export function UploadIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Icon>
  )
}

export function ImageIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9.5" r="1.4" />
      <path d="m4 17 4.4-4.4a1.6 1.6 0 0 1 2.2 0L15 17" />
      <path d="m13.5 15 1.7-1.7a1.6 1.6 0 0 1 2.2 0L20 16" />
    </Icon>
  )
}

export function CheckIcon(props) {
  return (
    <Icon {...props}>
      <path d="m5 12 4.5 4.5L19 7" />
    </Icon>
  )
}

export function CheckCircleIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Icon>
  )
}

export function CloseIcon(props) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  )
}

export function DownloadIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </Icon>
  )
}

export function RefreshIcon(props) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v5h-5" />
    </Icon>
  )
}

export function SwapIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 8h16" />
      <path d="m16 4 4 4-4 4" />
      <path d="M20 16H4" />
      <path d="m8 20-4-4 4-4" />
    </Icon>
  )
}

export function ShieldIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v5c0 4.4 2.9 7.8 7 9 4.1-1.2 7-4.6 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  )
}

export function LockIcon(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </Icon>
  )
}

export function BoltIcon(props) {
  return (
    <Icon {...props}>
      <path d="M13 2 4.5 13.5H11L9.5 22 19 10.5h-6.5L13 2Z" />
    </Icon>
  )
}

export function MonitorIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Icon>
  )
}

export function SparklesIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.6 8.4 18.5 10 13.6 11.6 12 16.5 10.4 11.6 5.5 10l4.9-1.6L12 3.5Z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </Icon>
  )
}

export function MenuIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function ArrowRightIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 12h16" />
      <path d="m14 6 6 6-6 6" />
    </Icon>
  )
}

export function AlertIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </Icon>
  )
}

export function InfoIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </Icon>
  )
}

export function ExpandIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 9V4h5" />
      <path d="M20 9V4h-5" />
      <path d="M4 15v5h5" />
      <path d="M20 15v5h-5" />
      <path d="m4 4 5 5" />
      <path d="m20 4-5 5" />
      <path d="m4 20 5-5" />
      <path d="m20 20-5-5" />
    </Icon>
  )
}

export function EraserIcon(props) {
  return (
    <Icon {...props}>
      <path d="m7.5 20-3.7-3.7a2 2 0 0 1 0-2.8L12 5.3a2 2 0 0 1 2.8 0l4.9 4.9a2 2 0 0 1 0 2.8L13 19.7" />
      <path d="M20 20H8" />
      <path d="m9 10 5 5" />
    </Icon>
  )
}

export function WandIcon(props) {
  return (
    <Icon {...props}>
      <path d="m4 20 11-11" />
      <path d="m14 5 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
      <path d="m19 12 .7-1.4L21 10l-1.3-.6L19 8l-.7 1.4L17 10l1.3.6L19 12Z" />
      <path d="m5.5 8.5.8-1.6 1.7-.4-1.2-1.3.2-1.7-1.5.8L4 3.5l-.2 1.7-1.3 1.2 1.7.5.8 1.6Z" />
    </Icon>
  )
}

export function CloudIcon(props) {
  return (
    <Icon {...props}>
      <path d="M7 18a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 8.7 4.6 4.6 0 0 1 17.5 18H7Z" />
    </Icon>
  )
}

export function StopIcon(props) {
  return (
    <Icon {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </Icon>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  )
}

export function PaletteIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.4-3.4 2 2 0 0 1 1.4-3.4H19a2 2 0 0 0 2-2A9 9 0 0 0 12 3Z" />
      <path d="M7.5 10h.01M9.5 6.5h.01M14 6.5h.01M17 10h.01" />
    </Icon>
  )
}

export function LayersIcon(props) {
  return (
    <Icon {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </Icon>
  )
}
