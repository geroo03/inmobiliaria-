import { redirect } from 'next/navigation';

// Sin subdominio, la raíz lleva al proyecto de demostración.
export default function Home() {
  redirect(`/p/${process.env.DEFAULT_PROJECT_SLUG || 'torre-algarrobo'}`);
}
