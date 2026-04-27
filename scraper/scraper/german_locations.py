"""German Bundesländer + major cities — used to fan out Bundesagentur queries
past the API's 10,000-result-per-query pagination cap."""

# 16 federal states (Bundesländer) — used with radius=50 for broad sweeps.
BUNDESLAENDER = (
    "Nordrhein-Westfalen", "Bayern", "Baden-Württemberg", "Niedersachsen",
    "Hessen", "Sachsen", "Rheinland-Pfalz", "Berlin", "Schleswig-Holstein",
    "Brandenburg", "Sachsen-Anhalt", "Thüringen", "Hamburg", "Mecklenburg-Vorpommern",
    "Saarland", "Bremen",
)

BUNDESLAND_SET = frozenset(BUNDESLAENDER)


# ~100 most populous German cities — used with radius=15km to slice past the 10k cap
# in the populous federal states. Sourced from Statistisches Bundesamt 2024 city
# population data (cities with population > ~75,000).
MAJOR_CITIES = (
    # NRW
    "Köln", "Düsseldorf", "Dortmund", "Essen", "Duisburg", "Bochum", "Wuppertal",
    "Bielefeld", "Bonn", "Münster", "Mönchengladbach", "Gelsenkirchen", "Aachen",
    "Krefeld", "Oberhausen", "Hagen", "Hamm", "Mülheim an der Ruhr", "Leverkusen",
    "Solingen", "Herne", "Neuss", "Paderborn", "Bottrop", "Recklinghausen",
    "Bergisch Gladbach", "Remscheid", "Trier", "Moers", "Siegen", "Iserlohn",
    # Bayern
    "München", "Nürnberg", "Augsburg", "Regensburg", "Würzburg", "Ingolstadt",
    "Fürth", "Erlangen", "Bayreuth", "Bamberg", "Aschaffenburg", "Landshut",
    "Kempten", "Rosenheim", "Schweinfurt",
    # Baden-Württemberg
    "Stuttgart", "Mannheim", "Karlsruhe", "Freiburg im Breisgau", "Heidelberg",
    "Heilbronn", "Ulm", "Pforzheim", "Reutlingen", "Tübingen", "Esslingen",
    "Ludwigsburg", "Konstanz", "Sindelfingen",
    # Niedersachsen
    "Hannover", "Braunschweig", "Oldenburg", "Osnabrück", "Wolfsburg", "Göttingen",
    "Salzgitter", "Hildesheim", "Lüneburg", "Wilhelmshaven", "Delmenhorst",
    # Hessen
    "Frankfurt am Main", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach",
    "Hanau", "Marburg", "Gießen", "Fulda",
    # Rheinland-Pfalz
    "Mainz", "Ludwigshafen am Rhein", "Koblenz", "Trier", "Kaiserslautern", "Worms",
    # Sachsen
    "Leipzig", "Dresden", "Chemnitz", "Zwickau", "Plauen",
    # Schleswig-Holstein
    "Kiel", "Lübeck", "Flensburg", "Neumünster",
    # Sachsen-Anhalt
    "Halle (Saale)", "Magdeburg", "Dessau-Roßlau",
    # Thüringen
    "Erfurt", "Jena", "Gera", "Weimar",
    # Mecklenburg-Vorpommern
    "Rostock", "Schwerin", "Neubrandenburg", "Stralsund",
    # Brandenburg
    "Potsdam", "Cottbus", "Brandenburg an der Havel", "Frankfurt (Oder)",
    # Saarland
    "Saarbrücken",
)


def is_bundesland(location: str) -> bool:
    """True if `location` is one of the 16 federal states (used with radius=50)."""
    return location.split(",")[0].strip() in BUNDESLAND_SET
