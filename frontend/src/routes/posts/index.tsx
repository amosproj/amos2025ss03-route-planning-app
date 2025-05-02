import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/posts/')({
  component: Posts,
});

function Posts() {
  const posts = [
    { id: 1, title: 'Post 1' },
    { id: 2, title: 'Post 2' },
    { id: 3, title: 'Post 3' },
  ];

  return (
    <div>
      <h1>Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link to="/posts/$postId" params={{ postId: post.title }}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
