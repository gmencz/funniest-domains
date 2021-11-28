import { HeartIcon } from "@heroicons/react/solid";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  likes: number;
};

export function UnlikeButton({ likes, ...htmlAttributes }: Props) {
  return (
    <button className="flex items-center space-x-2 group" {...htmlAttributes}>
      <div className="w-8 h-8 p-1.5 transition-colors group-hover:bg-red-100 rounded-full">
        <HeartIcon className="w-full h-full mr-1 transition-colors text-red-500" />
      </div>

      <span className="text-sm font-semibold transition-colors text-red-500">
        {Math.floor(likes)}
      </span>
    </button>
  );
}
