"use client";

import { useState } from "react";
import ApolarRefSearch from "@/components/apolar-ref-search";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function CadastroTesteTadabase() {
    const [propertyData, setPropertyData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handlePropertyFound = (data: any, bookings: any[]) => {
        setPropertyData(data);
        setResult(null); // Reset anterior
    };

    const handleClear = () => {
        setPropertyData(null);
        setResult(null);
    };

    const enviarParaTadabase = async () => {
        if (!propertyData) return;

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/test-cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyData }),
            });

            const resData = await response.json();
            setResult(resData);
        } catch (error: any) {
            setResult({ error: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container p-6 max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Teste de Cadastro (Tadabase)</h1>
                <p className="text-muted-foreground mt-2">
                    Esta página isola a lógica de scraping. Ela pesquisa a referência e envia os dados DIRETAMENTE
                    para o Tadabase, sem criar agendamento no Supabase e sem disparar emails.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <ApolarRefSearch
                        onPropertyFound={handlePropertyFound}
                        onClear={handleClear}
                    />
                </div>

                <div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="font-semibold leading-none tracking-tight">Painel de Envio</h3>
                            <p className="text-sm text-muted-foreground">Revise os dados antes de disparar para o Tadabase</p>
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            {!propertyData ? (
                                <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-md">
                                    Faça a busca por uma referência ao lado para começar.
                                </div>
                            ) : (
                                <>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md text-sm font-mono overflow-auto max-h-60">
                                        <pre>{JSON.stringify(propertyData, null, 2)}</pre>
                                    </div>

                                    <button
                                        onClick={enviarParaTadabase}
                                        className="w-full flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 h-10 px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enviando para o Tadabase...
                                            </>
                                        ) : (
                                            'Simular Cadastro no Tadabase'
                                        )}
                                    </button>
                                </>
                            )}

                            {result && (
                                <div className={`p-4 rounded-md mt-4 text-sm ${result.success ? 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {result.success ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 font-bold">
                                                <CheckCircle2 className="h-5 w-5" />
                                                Cadastro efetuado com sucesso!
                                            </div>
                                            <p>O Payload foi processado. Verifique o painel do Tadabase para ver se os campos foram preenchidos corretamente.</p>
                                            <details className="mt-2 cursor-pointer">
                                                <summary className="font-semibold">Ver Resposta Bruta</summary>
                                                <pre className="mt-2 text-xs overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
                                            </details>
                                        </div>
                                    ) : (
                                        <div>
                                            <strong>Erro ao enviar:</strong> {result.error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
