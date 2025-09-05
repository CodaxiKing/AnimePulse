import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Home, BookOpen, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMangaByIdAPI, getChaptersByMangaId, getChapterById } from "@/lib/api";

export default function ChapterReader() {
  const { mangaId, chapterNumber } = useParams();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const { data: manga, isLoading: loadingManga } = useQuery({
    queryKey: ["manga", mangaId],
    queryFn: () => getMangaByIdAPI(mangaId!),
    enabled: !!mangaId,
  });

  const { data: chapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ["chapters", mangaId],
    queryFn: () => getChaptersByMangaId(mangaId!),
    enabled: !!mangaId,
  });

  const { data: currentChapter, isLoading: loadingChapter } = useQuery({
    queryKey: ["chapter", mangaId, chapterNumber],
    queryFn: () => getChapterById(mangaId!, parseInt(chapterNumber!)),
    enabled: !!mangaId && !!chapterNumber,
  });

  // Navegação entre capítulos
  const currentChapterIndex = chapters.findIndex(c => c.number === parseInt(chapterNumber!));
  const nextChapter = chapters[currentChapterIndex + 1];
  const prevChapter = chapters[currentChapterIndex - 1];

  // Navegação com teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentChapter?.pages) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          if (currentPageIndex < currentChapter.pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
          }
          break;
        case 'Home':
          setCurrentPageIndex(0);
          break;
        case 'End':
          setCurrentPageIndex(currentChapter.pages.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPageIndex, currentChapter]);

  if (loadingManga || loadingChapter) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-white">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4 bg-white/10" />
            <p>Carregando capítulo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!manga || !currentChapter) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Capítulo não encontrado</h1>
          <p className="mb-6 opacity-75">O capítulo que você está procurando não existe.</p>
          <Link href={`/mangas/${mangaId}`}>
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Mangá
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header do leitor */}
      <div className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm z-50 border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={`/mangas/${mangaId}`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            
            <div className="text-white">
              <h1 className="font-semibold text-sm truncate max-w-48">
                {manga.title}
              </h1>
              <p className="text-xs opacity-75">
                Capítulo {currentChapter.number}: {currentChapter.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de capítulo */}
            <Select 
              value={chapterNumber} 
              onValueChange={(value) => window.location.href = `/mangas/${mangaId}/chapter/${value}`}
            >
              <SelectTrigger className="w-36 bg-white/10 border-white/20 text-white text-xs">
                <SelectValue placeholder="Capítulo" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.number.toString()}>
                    Cap. {chapter.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Controles de zoom */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/10 p-2"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-xs px-2">
                {Math.round(zoom * 100)}%
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/10 p-2"
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - páginas do mangá */}
      <div className="pt-16 pb-20">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          {currentChapter.pages && currentChapter.pages.length > 0 ? (
            <div 
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={currentChapter.pages[currentPageIndex]}
                alt={`${manga.title} - Capítulo ${currentChapter.number} - Página ${currentPageIndex + 1}`}
                className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                loading="lazy"
              />
              
              {/* Indicador de página */}
              <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm">
                {currentPageIndex + 1} / {currentChapter.pages.length}
              </div>
            </div>
          ) : (
            <div className="text-center text-white">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhuma página disponível para este capítulo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer com navegação */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Navegação de páginas */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              disabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            
            <span className="text-white text-sm px-3">
              Página {currentPageIndex + 1} de {currentChapter.pages?.length || 0}
            </span>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              disabled={currentPageIndex === (currentChapter.pages?.length || 1) - 1}
              onClick={() => setCurrentPageIndex(prev => Math.min((currentChapter.pages?.length || 1) - 1, prev + 1))}
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Navegação de capítulos */}
          <div className="flex items-center gap-2">
            {prevChapter && (
              <Link href={`/mangas/${mangaId}/chapter/${prevChapter.number}`}>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Cap. {prevChapter.number}
                </Button>
              </Link>
            )}
            
            {nextChapter && (
              <Link href={`/mangas/${mangaId}/chapter/${nextChapter.number}`}>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Cap. {nextChapter.number}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}