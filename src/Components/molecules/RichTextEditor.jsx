"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { Save } from 'lucide-react';

export default function RichTextEditor({ initialContent = "", onSave, readOnly = false }) {
  const cleanContent = (html) => {
    let text = html || "";
    if (text.includes("<p>")) {
      text = text.replace(/<[^>]+>/g, '\n').replace(/^\n+|\n+$/g, '').replace(/\n\n+/g, '\n\n');
    }
    return text;
  };

  const [content, setContent] = useState(() => cleanContent(initialContent));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);

  const debouncedSave = useCallback((newContent) => {
    setIsSaving(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(async () => {
      if (onSave) {
        await onSave(newContent);
      }
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000); // 1s delay
  }, [onSave]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    debouncedSave(val);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const formatTime = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(date);
  };

  return (
    <div className={`flex flex-col h-full w-full relative ${readOnly ? 'opacity-80' : ''}`}>
      {/* Indicador flotante de guardado */}
      <div className="absolute top-2 right-4 flex items-center gap-2 text-[11px] font-medium px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm z-10 pointer-events-none">
        {isSaving ? (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 animate-pulse">
            <Save className="w-3 h-3" /> Guardando...
          </span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Save className="w-3 h-3" /> Guardado {formatTime(lastSaved)}
          </span>
        ) : (
          <span className="text-muted-foreground/50">Escribe para guardar</span>
        )}
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder="Escribe aquí tus notas clínicas, observaciones o tareas..."
        className="flex-1 w-full h-full p-6 bg-transparent border-0 focus:ring-0 resize-none text-foreground leading-relaxed custom-scrollbar outline-none focus:outline-none"
        spellCheck="false"
      />
    </div>
  );
}
