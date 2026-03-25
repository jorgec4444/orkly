export default function StaticPage({ src }) {
  return (
    <iframe
      src={src}
      className="w-full h-screen border-none"
    />
  );
}