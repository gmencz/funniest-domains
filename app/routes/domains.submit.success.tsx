import type { LoaderFunction, MetaFunction } from "remix";
import { useCatch, useLoaderData, useParams, Link } from "remix";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

export let loader: LoaderFunction = async ({ request }) => {
  let userId = await requireUserId(request, "/domains/login");
  let url = new URL(request.url);
  let params = new URLSearchParams(url.search);
  let domain = params.get("domain");
  if (!domain) {
    throw new Response("Domain submission not found.", {
      status: 404,
    });
  }

  let domainSubmission = await db.domainSubmission.findFirst({
    where: {
      AND: [
        { domain: { equals: decodeURI(domain) } },
        { submittedById: { equals: userId } },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!domainSubmission) {
    throw new Response("Domain submission not found.", {
      status: 404,
    });
  }

  return {
    domain,
  };
};

type LoaderData = {
  domain: string;
};

export let meta: MetaFunction = ({ data }) => {
  if (!data) {
    return {
      title: "Something went wrong",
    };
  }

  let { domain } = data as LoaderData;
  return {
    title: `Submitted ${domain} successfully`,
  };
};

export default function Success() {
  let { domain } = useLoaderData<LoaderData>();

  return (
    <div className="w-full mx-auto max-w-2xl py-8 px-6 h-full flex justify-center items-start flex-col">
      <h1 className="text-xl text-gray-900 font-semibold">Success!</h1>
      <p className="mt-2 text-base text-gray-800">
        You've submitted the domain{" "}
        <a
          className="text-gray-700 font-medium underline"
          href={`https://${domain}`}
        >
          {domain}
        </a>{" "}
        and we will review it as soon as possible.
      </p>

      <Link
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        to="/domains"
      >
        Back to domains
      </Link>
    </div>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="w-full mx-auto max-w-2xl py-8 px-6 h-full flex justify-center items-center flex-col">
        <h1 className="text-2xl text-gray-900 font-semibold">
          Domain submission not found.
        </h1>

        <span className="text-xl mt-4 text-gray-900 font-bold mb-4">404</span>
      </div>
    );
  }
  throw new Error(`Unhandled error: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  let { domain } = useParams();

  return (
    <div className="w-full mx-auto max-w-2xl py-8 px-6 h-full flex justify-center items-center flex-col text-center">
      <span className="text-xl text-gray-900 font-bold mb-4">
        500 Internal Server Error
      </span>

      <h1 className="text-2xl text-gray-900 font-semibold">
        {domain
          ? `There was an error loading the domain submission for the domain ${domain}. Sorry.`
          : `There was an error loading the domain submission. Sorry.`}
      </h1>
    </div>
  );
}
