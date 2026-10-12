"""
In-memory and JSON storage for FoodRescue AI listings.
Includes realistic sample data for Greenwood College Central Canteen.
"""
import uuid
import datetime

INITIAL_SAMPLE_LISTINGS = [
    {
        "id": "canteen-sample-01",
        "food_name": "Vegetable Pulao & Spiced Dal Lunch Boxes",
        "quantity": "24",
        "unit": "boxes",
        "prep_time": "2026-10-12T11:00",
        "deadline": "2026-10-12T14:30",
        "location": "Greenwood College Central Canteen - Loading Dock B, Ground Floor",
        "storage_details": "Kept in insulated thermal warmer (>60°C). Packed in tamper-evident recyclable containers.",
        "seller_contact": "Chef Marcus, Greenwood Dining Service (Ph: 555-019-4821 / canteen@greenwood.edu)",
        "photo_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "created_at": "2026-10-12T11:15:00Z",
        "status": "available",
        "verification": {
            "temperature_checked": True,
            "clean_packaging": True,
            "allergens_declared": True,
            "seller_certified": True,
            "notes": "Prepared fresh this morning. Contains soy and cumin; gluten-free."
        },
        "ai_insights": {
            "source": "heuristic_engine",
            "is_gemma_active": False,
            "suggested_tags": ["Hot Meal", "Vegetarian", "Ready to Eat", "Cooked Today"],
            "suggested_handling": "Maintain thermal chain or consume/refrigerate within 2 hours of pickup.",
            "unverified_flags": [],
            "safety_notice": "AI cannot certify food safety. All storage conditions and edibility are certified solely by the seller."
        },
        "shareable_message": (
            "🚨 *SURPLUS FOOD ALERT - FoodRescue AI* 🚨\n\n"
            "🍱 *Food:* Vegetable Pulao & Spiced Dal Lunch Boxes\n"
            "📦 *Quantity:* 24 boxes\n"
            "⏰ *Prepared:* 2026-10-12 at 11:00\n"
            "⏳ *Pickup Deadline:* 2026-10-12 before 14:30\n"
            "📍 *Pickup Location:* Greenwood College Central Canteen - Loading Dock B, Ground Floor\n"
            "❄️ *Storage Condition:* Kept in insulated thermal warmer (>60°C). Packed in tamper-evident recyclable containers.\n"
            "📞 *Contact:* Chef Marcus, Greenwood Dining Service (Ph: 555-019-4821 / canteen@greenwood.edu)\n"
            "✅ *Seller Verification:* Temperature & packaging verified by donor.\n\n"
            "⚠️ *Safety Notice:* FoodRescue AI organizes surplus information; receiver must inspect upon pickup."
        )
    },
    {
        "id": "canteen-sample-02",
        "food_name": "Fresh Bakery Bagels & Blueberry Muffins",
        "quantity": "18",
        "unit": "assorted pieces",
        "prep_time": "2026-10-12T07:30",
        "deadline": "2026-10-12T17:00",
        "location": "Greenwood Student Union - North Quad Bakery Kiosk",
        "storage_details": "Ambient room temperature (dry & covered bakery case). Individually bagged in wax paper.",
        "seller_contact": "Elena Vance, Bakery Supervisor (Ext 4830 / bakehouse@greenwood.edu)",
        "photo_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        "created_at": "2026-10-12T08:00:00Z",
        "status": "available",
        "verification": {
            "temperature_checked": True,
            "clean_packaging": True,
            "allergens_declared": True,
            "seller_certified": True,
            "notes": "Contains wheat, dairy, eggs. Nut-free facility."
        },
        "ai_insights": {
            "source": "heuristic_engine",
            "is_gemma_active": False,
            "suggested_tags": ["Bakery", "Dry Goods", "Breakfast Assortment"],
            "suggested_handling": "Keep dry and away from humidity. Best consumed within 24 hours.",
            "unverified_flags": [],
            "safety_notice": "AI cannot certify food safety. All storage conditions and edibility are certified solely by the seller."
        },
        "shareable_message": (
            "🚨 *SURPLUS FOOD ALERT - FoodRescue AI* 🚨\n\n"
            "🥐 *Food:* Fresh Bakery Bagels & Blueberry Muffins\n"
            "📦 *Quantity:* 18 assorted pieces\n"
            "⏰ *Prepared:* 2026-10-12 at 07:30\n"
            "⏳ *Pickup Deadline:* 2026-10-12 before 17:00\n"
            "📍 *Pickup Location:* Greenwood Student Union - North Quad Bakery Kiosk\n"
            "❄️ *Storage Condition:* Ambient room temperature (dry & covered bakery case). Individually bagged in wax paper.\n"
            "📞 *Contact:* Elena Vance, Bakery Supervisor (Ext 4830 / bakehouse@greenwood.edu)\n"
            "✅ *Seller Verification:* Packaging verified by donor.\n\n"
            "⚠️ *Safety Notice:* FoodRescue AI organizes surplus information; receiver must inspect upon pickup."
        )
    }
]

class ListingStore:
    def __init__(self):
        # In-memory dictionary keyed by ID
        self._listings = {item["id"]: dict(item) for item in INITIAL_SAMPLE_LISTINGS}

    def get_all(self):
        """Return all listings sorted newest first."""
        items = list(self._listings.values())
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return items

    def get_by_id(self, listing_id):
        return self._listings.get(listing_id)

    def create(self, data):
        new_id = f"lst-{uuid.uuid4().hex[:8]}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        listing = dict(data)
        listing["id"] = new_id
        listing["created_at"] = now
        listing["status"] = listing.get("status", "available")
        self._listings[new_id] = listing
        return listing

    def update(self, listing_id, updates):
        if listing_id not in self._listings:
            return None
        self._listings[listing_id].update(updates)
        return self._listings[listing_id]

    def delete(self, listing_id):
        if listing_id in self._listings:
            del self._listings[listing_id]
            return True
        return False

    def reset_to_samples(self):
        self._listings = {item["id"]: dict(item) for item in INITIAL_SAMPLE_LISTINGS}
        return self.get_all()

# Singleton instance
store = ListingStore()
