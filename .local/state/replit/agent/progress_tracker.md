[x] 1. Install the required packages
[x] 2. Restart the workflow to see if the project is working
[x] 3. Verify the project is working using the feedback tool
[x] 4. Inform user the import is completed and they can start building, mark the import as completed using the complete_project_import tool
[x] 5. Remove 'Descobrir' tab from navigation and integrate ScrapedAnimeGrid into Animes page
[x] 6. Fix manga image loading by adding proper error handling and fallback images
[x] 7. Verified episode watch tracking functionality works correctly - episodes only marked as watched when video finishes playing
[x] 8. Added visual indicators for watched episodes in episode list with green checkmarks and styling
[x] 9. Created PostgreSQL database and configured all tables
[x] 10. Created admin user with credentials: username="admin", password="admin123", displayName="Admin Admin"
[x] 11. Evaluated AniAPI integration and confirmed current Jikan API + scraping setup is optimal
[x] 12. Verified all anime data fetching and streaming functionality is working properly
[x] 13. Removed generic video player and added proper error message when episode can't be fetched from API
[x] 14. Completely removed all placeholder/demo videos (BigBuckBunny, etc.) from both client and server - only real scraped videos will be used
[x] 15. Fixed API connection issue and permanently eliminated BigBuckBunny video - server now returns 404 when no real video is available
[x] 16. Adicionada aba de episódios na página de detalhes do anime com navegação para o player de vídeo
[x] 17. Substituído o modal de notícias por navegação para páginas dedicadas - cards de notícias agora redirecionam para `/noticias/:id` em vez de abrir modal