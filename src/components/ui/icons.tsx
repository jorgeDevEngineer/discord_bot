import type { SVGProps } from "react";

export function RailwayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      {...props}
    >
      <path d="M96.39 208a16 16 0 0 1-15.11-21.21L128 72.3l46.72 114.49a16 16 0 0 1-15.11 21.21Z" opacity="0.2" />
      <path d="M240 128a112 112 0 1 0-112 112a112.13 112.13 0 0 0 112-112Zm-24 0a88 88 0 1 1-88-88a88.1 88.1 0 0 1 88 88Zm-94.81 74.79a24 24 0 0 0 21.62-31.82L128 132.89l-16.81 38.08a24 24 0 0 0 21.62 31.82Zm-35.1-40.23 44.91-102.4a8 8 0 0 1 14.19 0l44.91 102.4a8 8 0 1 1-14.19 6.22L135.61 148h-43.23l-10.1 22.84a8 8 0 1 1-14.19-6.22ZM128 83.77l-29.94 68.23h59.88Z" />
    </svg>
  );
}
