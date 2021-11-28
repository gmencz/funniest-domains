import { HeartIcon } from "@heroicons/react/solid";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  likes: number;
};

export function LikeButton({ likes, ...htmlAttributes }: Props) {
  return (
    <button
      className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      {...htmlAttributes}
    >
      <HeartIcon className="w-5 h-5 text-red-600 mr-1" />
      <span>{Math.floor(likes)}</span>
    </button>
  );
}
