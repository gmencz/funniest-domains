import { HeartIcon } from "@heroicons/react/outline";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  LinkHTMLAttributes,
} from "react";
import { Link } from "remix";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  likes: number;
};

export function LikeButton({ likes, ...htmlAttributes }: ButtonProps) {
  return (
    <button className="flex items-center space-x-2 group" {...htmlAttributes}>
      <div className="w-8 h-8 p-1.5 transition-colors group-hover:bg-red-100 rounded-full">
        <HeartIcon className="w-full h-full text-gray-700 mr-1 transition-colors group-hover:text-red-500" />
      </div>

      <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-red-500">
        {Math.floor(likes)}
      </span>
    </button>
  );
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  likes: number;
  to: string;
};

export function LikeLink({ likes, to, ...htmlAttributes }: LinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center space-x-2 group"
      {...htmlAttributes}
    >
      <div className="w-8 h-8 p-1.5 transition-colors group-hover:bg-red-100 rounded-full">
        <HeartIcon className="w-full h-full text-gray-700 mr-1 transition-colors group-hover:text-red-500" />
      </div>

      <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-red-500">
        {Math.floor(likes)}
      </span>
    </Link>
  );
}
