"""
FoodRescue AI - Gemma 4 AI Service via Ollama Chat API.

Connects to Ollama at http://localhost:11434 using the gemma4:e2b model.
Strict Safety Invariants:
1. NEVER claim food is safe to eat, certified, or guaranteed fresh.
2. NEVER invent missing values, expiry dates, quantities, preparation times, storage history, or allergen details.
3. Explicitly flag missing or unverified information in a checklist.
4. Do NOT return mock output when Gemma fails; report the real connectivity/inference error.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, List

logger = logging.getLogger("MealMitra.Gemma")

SAFETY_DISCLAIMER = (
    "CRITICAL FOOD SAFETY NOTICE: AI cannot certify food safety, freshness, or donation eligibility. "
    "All food handling, temperature control, and safety verification must be confirmed directly "
    "by the food business/donor before redistribution."
)

PHOTO_SAFETY_WARNING = (
    "Visual inspection caveat: A normal photographic appearance does NOT guarantee absence of bacterial growth, "
    "spoilage, or allergens. Storage history and temperature records must be verified by the donor."
)

SYSTEM_PROMPT = (
    "You are the AI assistant for MealMitra, a surplus food coordination platform for college canteens, bakeries, and kitchens.\n"
    "Your job is to structure surplus food details into an organized listing, a short shareable message, and a missing-details checklist.\n\n"
    "CRITICAL SAFETY CONSTRAINTS:\n"
    "1. NEVER claim that the food is safe to eat, certified, or guaranteed fresh.\n"
    "2. NEVER invent missing values, expiry dates, quantities, preparation times, storage history, or allergen information.\n"
    "3. If any detail is missing or vague (e.g. preparation timestamp, collection deadline, temperature details, allergen disclosures), list it explicitly in 'missing_details_checklist'.\n"
    "4. Return ONLY a valid JSON object with the following keys:\n"
    "   - \"title\": string (a clear, descriptive title based on the food name)\n"
    "   - \"summary\": string (a concise summary using ONLY provided facts)\n"
    "   - \"tags\": array of strings (e.g. [\"Vegetarian\", \"Prepared Meal\", \"Hot Holding\"])\n"
    "   - \"suggested_handling\": string (safe redistribution advice based solely on stated storage conditions)\n"
    "   - \"shareable_message\": string (a short, polite alert ready for copy/pasting to WhatsApp or SMS, formatted with emojis)\n"
    "   - \"missing_details_checklist\": array of strings (checklist of missing, unverified, or ambiguous safety items)\n"
)


class OllamaGemmaService:
    def __init__(self):
        self.host = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
        self.model = os.getenv("OLLAMA_MODEL", "gemma4:e2b").strip()
        self.timeout = int(os.getenv("OLLAMA_TIMEOUT", "90"))

    def check_connection(self) -> Dict[str, Any]:
        """
        Tests connectivity to the Ollama service and checks if the model is installed.
        """
        try:
            resp = requests.get(f"{self.host}/api/tags", timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                # Check if exact model or base name matches
                model_found = any(self.model in m or m.startswith(self.model.split(":")[0]) for m in models)
                return {
                    "connected": True,
                    "host": self.host,
                    "target_model": self.model,
                    "model_available": model_found,
                    "available_models": models,
                    "message": f"Connected to Ollama. Model '{self.model}' {'is ready' if model_found else 'not found in list'}."
                }
            return {
                "connected": False,
                "host": self.host,
                "target_model": self.model,
                "model_available": False,
                "available_models": [],
                "message": f"Ollama returned HTTP status {resp.status_code}."
            }
        except requests.exceptions.ConnectionError:
            return {
                "connected": False,
                "host": self.host,
                "target_model": self.model,
                "model_available": False,
                "available_models": [],
                "message": f"Unable to reach Ollama at {self.host}. Please ensure Ollama is running ('ollama serve')."
            }
        except Exception as e:
            return {
                "connected": False,
                "host": self.host,
                "target_model": self.model,
                "model_available": False,
                "available_models": [],
                "message": f"Error contacting Ollama: {str(e)}"
            }

    def check_vision_support(self) -> Dict[str, Any]:
        """
        Queries Ollama to check whether the active model has a vision/CLIP encoder.
        Models like gemma:2b / gemma4:e2b are pure text models without image input capability.
        """
        try:
            resp = requests.post(f"{self.host}/api/show", json={"name": self.model}, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                families = data.get("details", {}).get("families") or [data.get("details", {}).get("family", "")]
                info_keys = str(data.get("model_info", {})).lower()
                
                # Check for multimodal vision components
                has_vision = any(f.lower() in ["clip", "mllama", "vision", "paligemma", "llava"] for f in families) or ("vision" in info_keys or "clip" in info_keys)
                return {
                    "supports_vision": has_vision,
                    "model": self.model,
                    "family": data.get("details", {}).get("family", "gemma"),
                    "explanation": (
                        f"Model '{self.model}' is verified with multimodal vision capabilities."
                        if has_vision else
                        f"Configured model '{self.model}' is a text-only language model without an image encoder (CLIP/vision). "
                        "AI photo analysis is disabled to prevent hallucinations. Food details must be confirmed by the donor."
                    )
                }
        except Exception as e:
            logger.warning("Error checking vision capability: %s", e)

        # Conservative default for gemma4:e2b
        return {
            "supports_vision": False,
            "model": self.model,
            "family": "gemma",
            "explanation": (
                f"Configured model '{self.model}' is a text-only language model without an image encoder. "
                "AI photo analysis is not supported by this model; food details must be confirmed by the donor."
            )
        }

    def analyze_food_photo(self, image_bytes: bytes = None) -> Dict[str, Any]:
        """
        Safely evaluates image input.
        If model lacks vision support, explicitly explains this without pretending analysis succeeded.
        """
        vision_check = self.check_vision_support()
        if not vision_check["supports_vision"]:
            return {
                "success": False,
                "supported": False,
                "model": self.model,
                "message": vision_check["explanation"],
                "suggested_food_name": None
            }

        # If a vision model is configured, it would process image here.
        return {
            "success": False,
            "supported": True,
            "message": "Vision processing not invoked.",
            "suggested_food_name": None
        }

    def get_status(self) -> Dict[str, Any]:
        """Provides status details for GET /api/health."""
        conn = self.check_connection()
        vision_info = self.check_vision_support()
        return {
            "service": "Ollama Gemma 4",
            "host": self.host,
            "model": self.model,
            "connected": conn["connected"],
            "model_available": conn["model_available"],
            "available_models": conn.get("available_models", []),
            "vision_supported": vision_info["supports_vision"],
            "vision_explanation": vision_info["explanation"],
            "status": "connected" if (conn["connected"] and conn["model_available"]) else ("offline" if not conn["connected"] else "model_missing"),
            "message": conn["message"]
        }

    def generate_listing(self, data: Dict[str, Any], has_photo: bool = False) -> Dict[str, Any]:
        """
        Invokes the real Gemma model via Ollama's Chat API: POST /api/chat.
        Returns the parsed AI response or raises an error.
        DOES NOT RETURN MOCK DATA ON FAILURE.
        """
        # Validate essential field
        food_name = (data.get("food_name") or "").strip()
        if not food_name:
            raise ValueError("Food name is required to generate a listing.")

        # Extract seller-provided facts
        seller_facts = {
            "food_name": food_name,
            "quantity": f"{data.get('quantity', '')} {data.get('unit', '')}".strip(),
            "prep_time": (data.get("prep_time") or "").strip(),
            "deadline": (data.get("deadline") or "").strip(),
            "location": (data.get("location") or "").strip(),
            "storage_details": (data.get("storage_details") or "").strip(),
            "seller_contact": (data.get("seller_contact") or "").strip(),
            "allergens": (data.get("allergens") or "").strip(),
        }

        # Build user prompt with exact input details
        user_prompt = (
            f"Please process the following surplus food information:\n"
            f"- Food Name: {seller_facts['food_name']}\n"
            f"- Quantity: {seller_facts['quantity'] or 'Not provided'}\n"
            f"- Preparation Date/Time: {seller_facts['prep_time'] or 'Not provided'}\n"
            f"- Pickup Deadline: {seller_facts['deadline'] or 'Not provided'}\n"
            f"- Pickup Location: {seller_facts['location'] or 'Not provided'}\n"
            f"- Storage Details: {seller_facts['storage_details'] or 'Not provided'}\n"
            f"- Seller Contact: {seller_facts['seller_contact'] or 'Not provided'}\n"
            f"- Known Allergens: {seller_facts['allergens'] or 'None declared'}\n\n"
            f"Generate the JSON structure following all system safety rules."
        )

        chat_url = f"{self.host}/api/chat"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.2
            }
        }

        try:
            logger.info("Sending request to Ollama (%s) model %s...", chat_url, self.model)
            resp = requests.post(chat_url, json=payload, timeout=self.timeout)
        except requests.exceptions.ConnectionError as ce:
            logger.error("Ollama connection failed: %s", ce)
            raise ConnectionError(
                f"Cannot connect to Ollama at {self.host}. Please start Ollama with 'ollama serve' "
                f"or ensure port 11434 is accessible."
            )
        except requests.exceptions.Timeout:
            logger.error("Ollama request timed out after %ds", self.timeout)
            raise TimeoutError(f"Ollama request timed out after {self.timeout} seconds while processing with model '{self.model}'.")
        except Exception as e:
            logger.error("Unexpected error contacting Ollama: %s", e)
            raise RuntimeError(f"Ollama communication error: {str(e)}")

        if resp.status_code != 200:
            err_msg = resp.text
            try:
                err_json = resp.json()
                err_msg = err_json.get("error", err_msg)
            except Exception:
                pass
            logger.error("Ollama returned status %s: %s", resp.status_code, err_msg)
            raise RuntimeError(f"Ollama returned HTTP {resp.status_code}: {err_msg}")

        # Parse Ollama response
        try:
            resp_data = resp.json()
            message_content = resp_data.get("message", {}).get("content", "")
            if not message_content:
                raise ValueError("Ollama returned an empty message response.")

            parsed_ai = json.loads(message_content)
        except Exception as parse_err:
            logger.error("Failed to parse JSON response from Gemma model: %s", parse_err)
            raise ValueError(f"Gemma model output could not be parsed as valid JSON: {str(parse_err)}")

        # Audit and enforce safety fields
        missing_checklist = list(parsed_ai.get("missing_details_checklist") or [])
        
        # Verify safety flags deterministically in case model overlooked any blank fields
        if not seller_facts["prep_time"] and not any("prep" in m.lower() for m in missing_checklist):
            missing_checklist.append("Missing Preparation Timestamp: Exact cooking or packing time is unrecorded.")
        if not seller_facts["deadline"] and not any("deadline" in m.lower() for m in missing_checklist):
            missing_checklist.append("Missing Collection Deadline: Expiry window is not set.")
        if not seller_facts["storage_details"] and not any("storage" in m.lower() for m in missing_checklist):
            missing_checklist.append("Missing Storage Conditions: Cold/hot holding temperature is unspecified.")
        if not seller_facts["allergens"] and not any("allergen" in m.lower() for m in missing_checklist):
            missing_checklist.append("Undeclared Allergens: No allergen declaration provided. Operator verification required.")
        if has_photo:
            missing_checklist.append(PHOTO_SAFETY_WARNING)

        return {
            "success": True,
            "generated": {
                "title": parsed_ai.get("title") or food_name,
                "summary": parsed_ai.get("summary") or f"Surplus food: {food_name}",
                "tags": parsed_ai.get("tags") or ["Surplus Food"],
                "suggested_handling": parsed_ai.get("suggested_handling") or "Verify storage conditions and inspect prior to redistribution.",
                "shareable_message": parsed_ai.get("shareable_message") or "",
                "missing_details_checklist": missing_checklist,
                "model": self.model,
                "source": "ollama_gemma4",
            },
            "seller_facts": seller_facts,
            "safety_notice": SAFETY_DISCLAIMER
        }


# Singleton instance
ai_service = OllamaGemmaService()
