import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Terminal,
  Server,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

// URL base fija del servicio REST
const BASE_URL = 'https://lab14-cloud.onrender.com/api/v1/respuesta/4';

// Opciones disponibles para el selector de vocales
const VOWELS = [
  { value: 'a', label: 'a — Vocal A' },
  { value: 'e', label: 'e — Vocal E' },
  { value: 'i', label: 'i — Vocal I (Por defecto)' },
  { value: 'o', label: 'o — Vocal O' },
  { value: 'u', label: 'u — Vocal U' },
];

export default function App() {
  // Estado para la vocal seleccionada (por defecto 'i')
  const [selectedVowel, setSelectedVowel] = useState('i');

  // Estados de ciclo de vida de la petición HTTP
  const [loading, setLoading] = useState(false);
  const [slowWakeUp, setSlowWakeUp] = useState(false);
  const [error, setError] = useState(null);

  // Estados para almacenar los detalles de la respuesta
  const [responseData, setResponseData] = useState(null);
  const [isJsonResponse, setIsJsonResponse] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // URL exacta construida dinámicamente
  const endpointUrl = `${BASE_URL}/${selectedVowel}`;

  /**
   * Ejecuta la petición HTTP GET hacia el endpoint dinámico.
   * Incluye AbortController para cancelar peticiones obsoletas si el usuario
   * cambia rápidamente de vocal, y detecta demoras por arranque en frío en Render.
   */
  const fetchEndpoint = useCallback(async (vowel, signal) => {
    const targetUrl = `${BASE_URL}/${vowel}`;
    setLoading(true);
    setSlowWakeUp(false);
    setError(null);

    // Aviso amigable si Render tarda más de 3 segundos en despertar el contenedor
    const wakeUpTimer = setTimeout(() => {
      setSlowWakeUp(true);
    }, 3000);

    const startTime = performance.now();

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
        signal,
      });

      const endTime = performance.now();
      const elapsedMs = Math.round(endTime - startTime);

      setResponseTime(elapsedMs);
      setStatusInfo({
        code: response.status,
        text: response.statusText || (response.ok ? 'OK' : 'Error'),
        ok: response.ok,
      });

      // Leemos el cuerpo como texto primero para soportar tanto JSON como texto plano
      const rawText = await response.text();
      let parsedContent = rawText;
      let parsedAsJson = false;

      if (rawText) {
        try {
          const jsonObj = JSON.parse(rawText);
          parsedContent = JSON.stringify(jsonObj, null, 2);
          parsedAsJson = true;
        } catch {
          // Si no es JSON válido, se conserva como texto plano limpio
          parsedContent = rawText;
          parsedAsJson = false;
        }
      } else {
        parsedContent = '(Respuesta vacía sin contenido en el cuerpo)';
      }

      setIsJsonResponse(parsedAsJson);
      setResponseData(parsedContent);

      if (!response.ok) {
        setError(
          `El servidor respondió con estado HTTP ${response.status} ${
            response.statusText || ''
          }. Revisa el detalle de la respuesta abajo.`
        );
      }
    } catch (err) {
      // Ignoramos errores provocados por cancelación controlada
      if (err.name === 'AbortError') return;

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setStatusInfo(null);
      setResponseData(null);
      setError(
        err.message === 'Failed to fetch'
          ? 'No se pudo conectar con el servidor (posible error de red, CORS o servicio temporalmente inaccesible).'
          : `Error inesperado al consultar la API: ${err.message}`
      );
    } finally {
      clearTimeout(wakeUpTimer);
      if (!signal?.aborted) {
        setLoading(false);
        setSlowWakeUp(false);
      }
    }
  }, []);

  // Ejecuta la petición automáticamente al montar y cada vez que cambia la vocal
  useEffect(() => {
    const controller = new AbortController();
    fetchEndpoint(selectedVowel, controller.signal);

    return () => {
      controller.abort();
    };
  }, [selectedVowel, fetchEndpoint]);

  // Manejador manual del botón Consultar / Actualizar
  const handleManualRefresh = () => {
    fetchEndpoint(selectedVowel);
  };

  // Copia la URL actual al portapapeles
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(endpointUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback silencioso si el navegador bloquea el portapapeles
    }
  };

  // Copia el cuerpo de la respuesta al portapapeles
  const handleCopyResponse = async () => {
    if (!responseData) return;
    try {
      await navigator.clipboard.writeText(responseData);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Encabezado */}
        <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Cliente REST — Lab14 Cloud
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
                    <Sparkles className="w-3 h-3" />
                    GET
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Selecciona una vocal para construir dinámicamente el segmento final de la ruta y consultar el servicio.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Panel de Control y Construcción de URL */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            {/* Listbox (<select>) para elegir la vocal */}
            <div className="sm:col-span-7">
              <label
                htmlFor="vowel-select"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Seleccionar vocal del parámetro final
              </label>
              <div className="relative">
                <select
                  id="vowel-select"
                  value={selectedVowel}
                  onChange={(e) => setSelectedVowel(e.target.value)}
                  disabled={loading}
                  className="w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 pr-10 text-base font-medium text-slate-900 dark:text-white shadow-xs focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 transition cursor-pointer"
                >
                  {VOWELS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Botón de Consultar / Actualizar */}
            <div className="sm:col-span-5">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 dark:disabled:bg-indigo-800/60 px-5 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Consultando...' : 'Consultar / Actualizar'}
              </button>
            </div>
          </div>

          {/* Visor de URL exacta en tiempo real */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                URL exacta invocada
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar URL</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 font-mono text-xs sm:text-sm overflow-x-auto">
              <span className="px-2 py-0.5 rounded-md bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold shrink-0">
                GET
              </span>
              <code className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {BASE_URL}/
                <span className="inline-block px-1.5 py-0.2 rounded bg-indigo-600 text-white font-bold">
                  {selectedVowel}
                </span>
              </code>
            </div>
          </div>
        </section>

        {/* Panel de Resultados, Métricas y Estado */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          {/* Barra superior con métricas de estado HTTP y tiempo */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              Respuesta del Servidor
            </h2>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Badge de Código HTTP */}
              {statusInfo && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    statusInfo.ok
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70'
                  }`}
                >
                  {statusInfo.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  HTTP {statusInfo.code} {statusInfo.text}
                </span>
              )}

              {/* Badge de Tiempo de Respuesta */}
              {responseTime !== null && !loading && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {responseTime} ms
                </span>
              )}

              {/* Formato detectado */}
              {responseData !== null && !loading && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
                  {isJsonResponse ? 'JSON' : 'Texto plano'}
                </span>
              )}
            </div>
          </div>

          {/* Indicador de carga */}
          {loading && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Invocando endpoint con la vocal &ldquo;{selectedVowel}&rdquo;...
                </p>
                {slowWakeUp && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 max-w-md mx-auto animate-pulse">
                    La instancia en Render puede tardar unos segundos en despertar si estaba inactiva. Por favor espera...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Banner de Error */}
          {!loading && error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 dark:border-rose-900/80 bg-rose-50/80 dark:bg-rose-950/40 p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800 dark:text-rose-200 space-y-1">
                <p className="font-semibold">Error en la solicitud</p>
                <p>{error}</p>
              </div>
            </div>
          )}

         {/* Cuerpo de la Respuesta Formateada */}
          {!loading && responseData !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Cuerpo de la respuesta ({isJsonResponse ? 'formateado como JSON' : 'texto sin formato'}):
                </span>
                <button
                  type="button"
                  onClick={handleCopyResponse}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  {copiedBody ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar respuesta</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="w-full rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 border border-slate-800 p-4 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                {responseData}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}