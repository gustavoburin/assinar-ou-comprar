import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold">Assinar ou Comprar? · Subscribe or Buy?</h1>
      <p className="text-muted">Escolha o país da loja · Choose the store country</p>
      <div className="flex gap-3">
        <Link href="/br" className="btn-primary">🇧🇷 Brasil (R$)</Link>
        <Link href="/us" className="btn-primary">🇺🇸 United States ($)</Link>
      </div>
    </main>
  );
}
