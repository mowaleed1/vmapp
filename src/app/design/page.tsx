export default function DesignPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 pb-20 font-sans">
      <main className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold mb-4">VMApp Design System</h1>
          <p className="text-muted-foreground text-lg">
            This page tests the brand tokens, colors, and typography for the VMApp ticketing system.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Primary Brand Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ColorSwatch name="Apple Green" colorClass="bg-[#3FD534]" hex="#3FD534" />
            <ColorSwatch name="Blue Ribbon" colorClass="bg-[#056BFC]" hex="#056BFC" />
            <ColorSwatch name="Sunset Strip" colorClass="bg-[#FABD00]" hex="#FABD00" />
            <ColorSwatch name="Black Cat" colorClass="bg-[#303030]" hex="#303030" />
            <ColorSwatch name="Alabaster" colorClass="bg-[#FBFBFB]" hex="#FBFBFB" border />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Theme Tokens (Auto-adjusting)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ColorSwatch name="Background" colorClass="bg-background" textClass="text-foreground" />
            <ColorSwatch name="Foreground" colorClass="bg-foreground" textClass="text-background" />
            <ColorSwatch name="Primary" colorClass="bg-primary" textClass="text-primary-foreground" />
            <ColorSwatch name="Secondary" colorClass="bg-secondary" textClass="text-secondary-foreground" />
            <ColorSwatch name="Accent" colorClass="bg-accent" textClass="text-accent-foreground" />
            <ColorSwatch name="Muted" colorClass="bg-muted" textClass="text-muted-foreground" />
            <ColorSwatch name="Destructive" colorClass="bg-destructive" textClass="text-destructive-foreground" />
            <ColorSwatch name="Card" colorClass="bg-card" textClass="text-card-foreground" border />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Typography Setup</h2>
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Heading 1 (text-4xl font-bold)</p>
              <h1 className="text-4xl font-bold">The quick brown fox jumps over the lazy dog.</h1>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Heading 2 (text-2xl font-semibold)</p>
              <h2 className="text-2xl font-semibold">The quick brown fox jumps over the lazy dog.</h2>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Large Text (text-lg)</p>
              <p className="text-lg">The quick brown fox jumps over the lazy dog, testing readability across lines.</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Body Text (text-base)</p>
              <p className="text-base">The quick brown fox jumps over the lazy dog, testing readability across lines. This is the main body font used for descriptions and general content.</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Small Text (text-sm)</p>
              <p className="text-sm">The quick brown fox jumps over the lazy dog, testing readability across lines.</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Muted Text (text-muted-foreground)</p>
              <p className="text-muted-foreground">The quick brown fox jumps over the lazy dog, testing readability across lines.</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Monospace (font-mono) - Good for Ticket IDs</p>
              <p className="font-mono bg-muted py-1 px-2 rounded w-fit">TKT-8942-VM</p>
            </div>
          </div>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">UI Elements</h2>
          
          <div className="flex flex-wrap gap-4">
             <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors">
                Primary Button
             </button>
             <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors">
                Secondary Button
             </button>
             <button className="bg-accent text-accent-foreground hover:bg-accent/80 px-4 py-2 rounded-md font-medium transition-colors">
                Accent Button
             </button>
             <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md font-medium transition-colors">
                Destructive
             </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function ColorSwatch({ 
  name, 
  colorClass, 
  hex, 
  textClass = "text-foreground",
  border = false
}: { 
  name: string, 
  colorClass: string, 
  hex?: string,
  textClass?: string,
  border?: boolean
}) {
  return (
    <div className="flex flex-col space-y-2">
      <div 
        className={`h-24 rounded-md shadow-sm flex items-end p-2 ${colorClass} ${border ? 'border' : ''} ${textClass}`}
      >
        <span className="font-medium text-sm drop-shadow-sm mix-blend-difference text-white">{name}</span>
      </div>
      {(hex || name) && (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{name}</p>
          {hex && <p className="font-mono">{hex}</p>}
        </div>
      )}
    </div>
  );
}
