import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Brain, Zap, Code2 } from 'lucide-react';
import { executeBrainRot } from '@/lib/brainrot-interpreter';
import { toast } from 'sonner';

const EXAMPLE_PROGRAMS = {
  hello: `#rot Welcome to BrainRot!
rott "Hello, I am brainrotted!";`,
  
  countdown: `#rot Countdown chaos
mold x = 5;
spin x > 0 {
  rott "Countdown: " + x;
  mold x = x - 1;
}
rott "BRAIN ROT COMPLETE!";`,
  
  fibonacci: `#rot Fibonacci madness
fnrot fib(n) {
  ifrot n < 2 {
    rott n;
  }
  elsed {
    rott fib(n - 1) + fib(n - 2);
  }
}

mold i = 0;
spin i < 8 {
  fib(i);
  mold i = i + 1;
}`,
  
  logic: `#rot Logic rotting
mold a = 5;
mold b = 10;

ifrot a > b orrot b == 10 {
  rott "Brain rot detected!";
}

ifrot a < b androt b > 8 {
  rott "Double brain rot!";
}

ifrot notrot a == b {
  rott "Not equal rot!";
}`
};

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function CodeEditor({ value, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="relative h-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-full p-4 bg-card text-card-foreground font-mono text-sm resize-none border-0 outline-none terminal-bg"
        placeholder="// Write your BrainRot code here...
// Use keywords: mold, rott, spin, ifrot, elsed, fnrot
// Example: mold x = 42; rott x;"
        spellCheck={false}
      />
      <div className="absolute top-2 right-2 opacity-50">
        <Badge variant="outline" className="chaos-border text-xs">
          <Code2 className="w-3 h-3 mr-1" />
          BrainRot
        </Badge>
      </div>
    </div>
  );
}

interface OutputConsoleProps {
  output: string[];
  error?: { message: string; line: number; column: number; type: string };
  isRunning: boolean;
}

function OutputConsole({ output, error, isRunning }: OutputConsoleProps) {
  return (
    <div className="h-full overflow-auto p-4 font-mono text-sm terminal-bg">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Zap className="w-4 h-4 text-neon-cyan" />
        <span className="text-muted-foreground">Output Console</span>
        {isRunning && (
          <Badge variant="secondary" className="animate-pulse">
            Running...
          </Badge>
        )}
      </div>
      
      {output.length === 0 && !error && !isRunning && (
        <div className="text-muted-foreground italic">
          Run your BrainRot code to see output here...
        </div>
      )}
      
      {output.map((line, index) => (
        <div key={index} className="text-neon-green mb-1">
          <span className="text-muted-foreground mr-2">$</span>
          {line}
        </div>
      ))}
      
      {error && (
        <div className="text-destructive bg-destructive/10 p-2 rounded mt-2 border border-destructive/20">
          <div className="font-semibold">💀 {error.type} ERROR</div>
          <div className="text-sm mt-1">{error.message}</div>
          {error.line > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Line {error.line}, Column {error.column}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrainRotIDE() {
  const [code, setCode] = useState(EXAMPLE_PROGRAMS.hello);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setError(null);
    
    // Add a small delay for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const result = executeBrainRot(code);
      setOutput(result.output);
      
      if (result.error) {
        setError(result.error);
        toast.error('Brain rot detected!', {
          description: result.error.message
        });
      } else {
        toast.success('Code executed successfully!', {
          description: `Produced ${result.output.length} output lines`
        });
      }
    } catch (err: any) {
      setError({
        message: err.message,
        line: 0,
        column: 0,
        type: 'RUNTIME'
      });
      toast.error('Execution failed!');
    }
    
    setIsRunning(false);
  };

  const clearOutput = () => {
    setOutput([]);
    setError(null);
    toast.info('Output cleared');
  };

  const loadExample = (example: string) => {
    setCode(EXAMPLE_PROGRAMS[example as keyof typeof EXAMPLE_PROGRAMS]);
    setOutput([]);
    setError(null);
    toast.success(`Loaded ${example} example`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="w-8 h-8 text-primary neon-glow" />
              <div className="absolute inset-0 animate-pulse">
                <Brain className="w-8 h-8 text-neon-cyan opacity-50" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold glitch-text bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent">
                BrainRot IDE
              </h1>
              <p className="text-muted-foreground text-sm">
                Where chaos meets computation
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={runCode} 
              disabled={isRunning}
              className="neon-glow"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Rotting...' : 'Run Code'}
            </Button>
            <Button 
              onClick={clearOutput} 
              variant="outline"
              className="chaos-border"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Main IDE */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
          {/* Code Editor */}
          <Card className="p-0 overflow-hidden chaos-border">
            <div className="h-full flex flex-col">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="font-semibold text-sm">Code Editor</h3>
              </div>
              <div className="flex-1">
                <CodeEditor value={code} onChange={setCode} />
              </div>
            </div>
          </Card>

          {/* Output Console */}
          <Card className="p-0 overflow-hidden chaos-border">
            <div className="h-full flex flex-col">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="font-semibold text-sm">Output</h3>
              </div>
              <div className="flex-1">
                <OutputConsole 
                  output={output} 
                  error={error} 
                  isRunning={isRunning} 
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Examples */}
        <Card className="mt-6 chaos-border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-neon-yellow" />
              Example Programs
            </h3>
            <Tabs defaultValue="syntax" className="w-full">
              <TabsList className="grid w-full grid-cols-5 chaos-border">
                <TabsTrigger value="syntax">Syntax</TabsTrigger>
                <TabsTrigger value="hello">Hello</TabsTrigger>
                <TabsTrigger value="countdown">Countdown</TabsTrigger>
                <TabsTrigger value="fibonacci">Fibonacci</TabsTrigger>
                <TabsTrigger value="logic">Logic</TabsTrigger>
              </TabsList>

              <TabsContent value="syntax" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-neon-cyan mb-2">Keywords:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li><code className="text-neon-pink">mold</code> - Variable declaration</li>
                      <li><code className="text-neon-pink">rott</code> - Print output</li>
                      <li><code className="text-neon-pink">spin</code> - While loop</li>
                      <li><code className="text-neon-pink">ifrot</code> - If statement</li>
                      <li><code className="text-neon-pink">elsed</code> - Else statement</li>
                      <li><code className="text-neon-pink">fnrot</code> - Function declaration</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neon-cyan mb-2">Operators:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li><code className="text-neon-yellow">androt</code> - Logical AND</li>
                      <li><code className="text-neon-yellow">orrot</code> - Logical OR</li>
                      <li><code className="text-neon-yellow">notrot</code> - Logical NOT</li>
                      <li><code className="text-neon-yellow">==</code> - Equal to</li>
                      <li><code className="text-neon-yellow">!=</code> - Not equal to</li>
                      <li><code className="text-neon-yellow">#rot</code> - Comments</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {Object.entries(EXAMPLE_PROGRAMS).map(([key, value]) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <div className="bg-muted/50 p-4 rounded font-mono text-sm terminal-bg">
                    <pre className="whitespace-pre-wrap">{value}</pre>
                  </div>
                  <Button 
                    onClick={() => loadExample(key)} 
                    className="mt-3"
                    variant="outline"
                  >
                    Load Example
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}