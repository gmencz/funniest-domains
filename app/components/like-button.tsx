import { HeartIcon } from "@heroicons/react/solid";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  likes: number;
};

export function LikeButton({ likes, ...htmlAttributes }: Props) {
  return (
    <button {...htmlAttributes}>
      <HeartIcon className="heart-icon" />
      <span className="likes-number">{Math.floor(likes)}</span>
    </button>
  );
}
