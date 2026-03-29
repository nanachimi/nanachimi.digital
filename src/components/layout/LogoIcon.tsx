interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className = "h-8 w-8" }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Small bottom-left square */}
      <rect
        x="5"
        y="60"
        width="22"
        height="22"
        rx="2"
        fill="#FFC62C"
        stroke="#E3AA2C"
        strokeWidth="1"
      />
      {/* Medium middle square */}
      <rect
        x="20"
        y="38"
        width="32"
        height="32"
        rx="3"
        fill="#FFC62C"
        stroke="#E3AA2C"
        strokeWidth="1"
      />
      {/* Large top-right square (outline) */}
      <rect
        x="40"
        y="10"
        width="42"
        height="42"
        rx="4"
        fill="none"
        stroke="#393E46"
        strokeWidth="5"
      />
      {/* Connection piece */}
      <rect
        x="40"
        y="38"
        width="12"
        height="12"
        fill="#393E46"
      />
    </svg>
  );
}
