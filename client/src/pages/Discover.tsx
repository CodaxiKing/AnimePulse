import { useState } from "react";
import { Search, Globe, ExternalLink, Info } from "lucide-react";
import ScrapedAnimeGrid from "../components/ScrapedAnimeGrid";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");

  const supportedSites = [
    {
      name: "AnimesDigital.org",
      url: "https://animesdigital.org",
      description: "Grande variedade de animes com qualidade HD"
    },
    {
      name: "AnimesOnlineCC.to", 
      url: "https://animesonlinecc.to",
      description: "Coleção extensa de animes legendados e dublados"
    },
    {
      name: "Goyabu.to",
      url: "https://goyabu.to", 
      description: "Animes populares com episódios atualizados"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Search className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Descobrir Animes</h1>
            <p className="text-muted-foreground">
              Explore animes de diversos sites de streaming através de web scraping
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta funcionalidade usa web scraping para buscar animes em tempo real dos sites de streaming. 
            Os resultados podem variar dependendo da disponibilidade dos sites.
          </AlertDescription>
        </Alert>
      </div>

      {/* Sites Suportados */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Sites Suportados
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supportedSites.map((site, index) => (
            <Card key={index} className="hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{site.name}</span>
                  <Badge variant="outline" className="text-xs">
                    Ativo
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">
                  {site.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(site.url, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Visitar Site
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Grid de Animes */}
      <ScrapedAnimeGrid 
        initialQuery={searchQuery}
        className="space-y-6"
      />

      {/* Footer Info */}
      <div className="bg-muted/30 rounded-xl p-6 text-center space-y-3">
        <h3 className="font-semibold text-lg">Como Funciona</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Nossa tecnologia de web scraping busca animes automaticamente em vários sites de streaming, 
          permitindo que você encontre e assista aos seus animes favoritos de forma centralizada. 
          Os dados são atualizados em tempo real para garantir a melhor experiência.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary">Busca em Tempo Real</Badge>
          <Badge variant="secondary">Múltiplos Sites</Badge>
          <Badge variant="secondary">Interface Unificada</Badge>
          <Badge variant="secondary">Episódios Atualizados</Badge>
        </div>
      </div>
    </div>
  );
}