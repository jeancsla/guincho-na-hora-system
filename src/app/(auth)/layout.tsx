export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand side */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] bg-zinc-950 text-white p-12 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Red accent blob */}
        <div
          aria-hidden
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-600 rounded-full blur-3xl opacity-20 pointer-events-none"
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="bg-red-600 rounded-xl p-2.5">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 18h8M3 10h18l-2-6H5L3 10zm0 0v6a2 2 0 002 2h14a2 2 0 002-2v-6" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight">Guincho na Hora</p>
            <p className="text-xs text-zinc-500">CRM</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Gestão <span className="text-red-500">eficiente</span><br />
            do seu negócio.
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Atendimentos, clientes, motoristas e veículos — tudo em um único lugar.
          </p>
        </div>

        {/* Stats strip */}
        <div className="relative flex gap-8">
          {[
            { label: "Atendimentos", value: "1.700+" },
            { label: "Precisão", value: "100%" },
            { label: "Tempo real", value: "✓" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form side */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
