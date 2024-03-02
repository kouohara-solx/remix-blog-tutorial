import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import invariant from "tiny-invariant";

import { updatePost, deletePost, getPost } from "~/models/post.server";

export const loader = async ({
                               params,
                             }: LoaderFunctionArgs) => {
  invariant(params.slug, "params.slug is required");
  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json({ post });
};

export const action = async ({
                               request
                             }: ActionFunctionArgs) => {

  const formData = await request.formData();
  if (formData.get("submit") === "delete") {
    await deletePost(formData.get("slug") as string);
    return redirect("/posts/admin");
  } else {

    const title = formData.get("title");
    const slug = formData.get("slug");
    const markdown = formData.get("markdown");
    const errors = {
      title: title ? null : "Title is required",
      slug: slug ? null : "Slug is required",
      markdown: markdown ? null : "Markdown is required"
    };
    const hasErrors = Object.values(errors).some(
      (errorMessage) => errorMessage
    );
    if (hasErrors) {
      return json(errors);
    }
    invariant(
      typeof title === "string",
      "title must be a string"
    );
    invariant(
      typeof slug === "string",
      "slug must be a string"
    );
    invariant(
      typeof markdown === "string",
      "markdown must be a string"
    );
    await updatePost({ title, slug, markdown });
    return redirect("/posts/admin");
  }
};

const inputClassName =
  "w-full rounded border border-gray-500 px-2 py-1 text-lg";

export default function UpdatePost() {
  const { post } = useLoaderData<typeof loader>();
  const errors = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = Boolean(
    navigation.state === "submitting"
  );
  return (
    <Form method="post">
      <p>
        <label>
          Post Title:{""}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={post.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{""}
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={post.slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">Markdown: {""}
          {errors?.markdown ? (
            <em className="text-red-600">
              {errors.markdown}
            </em>
          ) : null}
        </label>
        <br />
        <textarea
          id="markdown"
          rows={10}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={post.markdown}
        />
      </p>
      <div className="mt-2 flex items-center justify-end gap-x-6">
        <button
          type="submit"
          name="submit"
          value="delete"
          className="rounded bg-blue-500 py-2
           px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Deleting..." : "Delete Post"}
        </button>
        <button
          type="submit"
          name="submit"
          value="update"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Post"}
        </button>
      </div>
    </Form>
  );
}
