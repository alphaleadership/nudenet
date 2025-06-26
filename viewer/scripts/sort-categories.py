import json

# Ouvrir et lire le fichier categories.json
def load_categories():
    try:
        with open('./categories.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erreur lors de la lecture du fichier: {e}")
        return None

def sort_categories(categories):
    if categories is None:
        return None
    
    # Trier les clés par valeur numérique
    sorted_categories = dict(sorted(categories.items(), key=lambda item: int(item[1])))
    return sorted_categories

def save_sorted_categories(sorted_categories):
    if sorted_categories is None:
        return
    
    try:
        with open('./categories.json', 'w', encoding='utf-8') as f:
            json.dump(sorted_categories, f, indent=2, ensure_ascii=False)
        print("Catégories triées et sauvegardées dans sorted-categories.json")
    except Exception as e:
        print(f"Erreur lors de la sauvegarde: {e}")

def main():
    categories = load_categories()
    if categories is not None:
        sorted_categories = sort_categories(categories)
        save_sorted_categories(sorted_categories)

if __name__ == "__main__":
    main()
