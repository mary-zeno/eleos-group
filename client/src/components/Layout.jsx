import Navigation from './Navigation';

export default function Layout({ user, children, onHome = false }) {
  return (
    <div className="min-h-screen bg-charcoal-950">
      <Navigation user={user} />
      <main className={`${onHome ? "" : "mx-auto max-w-7xl"}`}>
        {children}
      </main>
    </div>
  );
}