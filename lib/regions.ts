
// Official 10 Regional Administrations of Curitiba
// Source: IPPUC (Institute of Research and Urban Planning of Curitiba)

export const CURITIBA_REGIONS: Record<string, string[]> = {
    "Matriz": [
        "Abranches", "Ahú", "Alto da Glória", "Alto da XV", "Batel", "Bigorrilho",
        "Bom Retiro", "Cabral", "Centro", "Centro Cívico", "Cristo Rei", "Hugo Lange",
        "Jardim Botânico", "Jardim Social", "Juvevê", "Mercês", "Pilarzinho", "Prado Velho",
        "Rebouças", "São Francisco"
    ],
    "Boa Vista": [
        "Abranches", "Atuba", "Bacacheri", "Bairro Alto", "Barreirinha", "Boa Vista",
        "Cachoeira", "Pilarzinho", "Santa Cândida", "São Lourenço", "Taboão", "Tarumã", "Tingui"
        // Note: Some neighborhoods like Abranches/Pilarzinho span multiple, but we simplify for primary assignment
    ],
    "Cajuru": [
        "Cajuru", "Capão da Imbuia", "Guabirotuba", "Jardim das Américas", "Tarumã", "Uberaba"
    ],
    "Portão": [
        "Água Verde", "Campo Comprido", "Fazendinha", "Guaíra", "Lindóia", "Novo Mundo",
        "Parolin", "Portão", "Santa Quitéria", "Seminário", "Vila Izabel"
    ],
    "Santa Felicidade": [
        "Butiatuvinha", "Campina do Siqueira", "Campo Comprido", "Cascatinha", "Lamenha Pequena",
        "Mossunguê", "Orleans", "Santa Felicidade", "Santo Inácio", "São Braz", "São João", "Vista Alegre"
    ],
    "Boqueirão": [
        "Alto Boqueirão", "Boqueirão", "Hauer", "Xaxim"
    ],
    "Pinheirinho": [
        "Capão Raso", "Fanny", "Lindóia", "Novo Mundo", "Pinheirinho"
    ],
    "Bairro Novo": [
        "Ganchinho", "Sítio Cercado", "Umbará"
    ],
    "CIC": [
        "Augusta", "Cidade Industrial", "Riviera", "São Miguel"
    ],
    "Tatuquara": [
        "Campo de Santana", "Caximba", "Tatuquara"
    ]
};

// Flattened list for easy lookup: Neighborhood -> Region
export const NEIGHBORHOOD_TO_REGION: Record<string, string> = {};

Object.entries(CURITIBA_REGIONS).forEach(([region, neighborhoods]) => {
    neighborhoods.forEach(n => {
        NEIGHBORHOOD_TO_REGION[n] = region;
    });
});
