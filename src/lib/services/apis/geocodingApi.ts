import { GeocodeResult } from "./types/apiTypes";
import { API_KEYS, apiCache } from "../apiConfig";

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> => {
  const cacheKey = `reverse_geocode_${latitude.toFixed(6)}_${longitude.toFixed(
    6
  )}`;

  try {
    console.log(
      "[Geocoding API] Starting reverse geocoding for coordinates:",
      latitude,
      longitude
    );

    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log("[Geocoding API] Using cached reverse geocoding data");
      return cachedData;
    }

    if (
      !latitude ||
      !longitude ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      console.error(
        "[Geocoding API] Invalid coordinates provided:",
        latitude,
        longitude
      );
      throw new Error("Invalid coordinates");
    }

    console.log("[Geocoding API] Coordinates validated successfully");

    if (
      API_KEYS.GOOGLE_GEOCODING &&
      API_KEYS.GOOGLE_GEOCODING !== "YOUR_GOOGLE_API_KEY"
    ) {
      console.log("[Geocoding API] Attempting Google Geocoding API");
      console.log(
        "[Geocoding API] API Key (first 10 chars):",
        API_KEYS.GOOGLE_GEOCODING.substring(0, 10) + "..."
      );

      const params = {
        latlng: `${latitude},${longitude}`,
        key: API_KEYS.GOOGLE_GEOCODING,
        language: "en",
      };

      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${params.latlng}&key=${params.key}&language=${params.language}`;
      console.log("[Geocoding API] Making Google Geocoding request");

      try {
        const response = await fetch(googleUrl, {
          method: "GET",
          headers: {
            "User-Agent": "FieldTripLogger/1.0",
          },
        });

        console.log("[Geocoding API] Google response status:", response.status);

        if (!response.ok) {
          console.error(
            "[Geocoding API] Google API HTTP error:",
            response.status,
            response.statusText
          );
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[Geocoding API] Google response status:", data.status);
        console.log(
          "[Geocoding API] Google results count:",
          data.results?.length || 0
        );

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components || [];

          console.log(
            "[Geocoding API] Processing Google address components:",
            addressComponents.length
          );

          let city = "Unknown City";
          let country = "Unknown Country";

          for (const component of addressComponents) {
            if (
              component.types.includes("locality") ||
              component.types.includes("administrative_area_level_1")
            ) {
              city = component.long_name;
            }
            if (component.types.includes("country")) {
              country = component.long_name;
            }
          }

          const geocodeResult: GeocodeResult = {
            address: result.formatted_address,
            city: city,
            country: country,
            formattedAddress: result.formatted_address,
          };

          console.log(
            "[Geocoding API] Google geocoding successful:",
            geocodeResult
          );

          apiCache.set(cacheKey, geocodeResult);

          return geocodeResult;
        } else {
          console.warn(
            "[Geocoding API] Google API returned error status:",
            data.status
          );
          if (data.error_message) {
            console.error(
              "[Geocoding API] Google API error message:",
              data.error_message
            );
          }
          throw new Error(`Google Geocoding API error: ${data.status}`);
        }
      } catch (googleError) {
        console.error(
          "[Geocoding API] Google Geocoding API failed:",
          googleError
        );
        console.log("[Geocoding API] Falling back to Nominatim");
      }
    } else {
      console.warn(
        "[Geocoding API] Google API key not available, using Nominatim directly"
      );
    }

    console.log("[Geocoding API] Using Nominatim (OpenStreetMap) as fallback");

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    console.log("[Geocoding API] Making Nominatim request");

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "FieldTripLogger/1.0",
      },
    });

    console.log("[Geocoding API] Nominatim response status:", response.status);

    if (!response.ok) {
      console.error(
        "[Geocoding API] Nominatim HTTP error:",
        response.status,
        response.statusText
      );
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[Geocoding API] Nominatim response received");
    console.log(
      "[Geocoding API] Nominatim display name available:",
      !!data.display_name
    );

    if (!data || !data.display_name) {
      console.error(
        "[Geocoding API] No geocoding results found from Nominatim"
      );
      throw new Error("No geocoding results found");
    }

    const address = data.address || {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.neighbourhood ||
      "Unknown City";

    const country = address.country || "Unknown Country";

    const geocodeResult: GeocodeResult = {
      address: data.display_name,
      city: city,
      country: country,
      formattedAddress: data.display_name,
    };

    console.log(
      "[Geocoding API] Nominatim geocoding successful:",
      geocodeResult
    );

    apiCache.set(cacheKey, geocodeResult);

    return geocodeResult;
  } catch (error) {
    console.error("[Geocoding API] Reverse geocoding error:", error);

    const fallbackResult: GeocodeResult = {
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: "Unknown Location",
      country: "Unknown",
      formattedAddress: `Coordinates: ${latitude.toFixed(
        4
      )}, ${longitude.toFixed(4)}`,
    };

    console.log(
      "[Geocoding API] Using fallback geocoding result:",
      fallbackResult
    );
    return fallbackResult;
  }
};

export const forwardGeocode = async (
  address: string
): Promise<{ latitude: number; longitude: number; address: string } | null> => {
  const cacheKey = `forward_geocode_${address
    .toLowerCase()
    .replace(/\s+/g, "_")}`;

  try {
    console.log(
      "[Geocoding API] Starting forward geocoding for address:",
      address
    );

    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log("[Geocoding API] Using cached forward geocoding data");
      return cachedData;
    }

    if (!address || address.trim().length === 0) {
      console.error("[Geocoding API] Empty address provided");
      throw new Error("Address is required");
    }

    console.log("[Geocoding API] Address validated successfully");

    if (
      API_KEYS.GOOGLE_GEOCODING &&
      API_KEYS.GOOGLE_GEOCODING !== "YOUR_GOOGLE_API_KEY"
    ) {
      console.log("[Geocoding API] Attempting Google forward geocoding");

      const params = {
        address: encodeURIComponent(address),
        key: API_KEYS.GOOGLE_GEOCODING,
        language: "en",
      };

      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${params.address}&key=${params.key}&language=${params.language}`;
      console.log("[Geocoding API] Making Google forward geocoding request");

      try {
        const response = await fetch(googleUrl, {
          method: "GET",
          headers: {
            "User-Agent": "FieldTripLogger/1.0",
          },
        });

        console.log(
          "[Geocoding API] Google forward response status:",
          response.status
        );

        if (!response.ok) {
          console.error(
            "[Geocoding API] Google forward API HTTP error:",
            response.status
          );
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(
          "[Geocoding API] Google forward response status:",
          data.status
        );
        console.log(
          "[Geocoding API] Google forward results count:",
          data.results?.length || 0
        );

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const result = data.results[0];
          const location = result.geometry.location;

          const forwardResult = {
            latitude: location.lat,
            longitude: location.lng,
            address: result.formatted_address,
          };

          console.log(
            "[Geocoding API] Google forward geocoding successful:",
            forwardResult
          );

          apiCache.set(cacheKey, forwardResult);

          return forwardResult;
        } else {
          console.warn(
            "[Geocoding API] Google forward API returned error status:",
            data.status
          );
          throw new Error(`Google Geocoding API error: ${data.status}`);
        }
      } catch (googleError) {
        console.error(
          "[Geocoding API] Google forward geocoding failed:",
          googleError
        );
        console.log(
          "[Geocoding API] Falling back to Nominatim for forward geocoding"
        );
      }
    } else {
      console.warn(
        "[Geocoding API] Google API key not available for forward geocoding, using Nominatim"
      );
    }

    console.log("[Geocoding API] Using Nominatim for forward geocoding");

    const encodedAddress = encodeURIComponent(address);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
    console.log("[Geocoding API] Making Nominatim forward request");

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "FieldTripLogger/1.0",
      },
    });

    console.log(
      "[Geocoding API] Nominatim forward response status:",
      response.status
    );

    if (!response.ok) {
      console.error(
        "[Geocoding API] Nominatim forward HTTP error:",
        response.status
      );
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(
      "[Geocoding API] Nominatim forward results count:",
      data.length
    );

    if (!data || data.length === 0) {
      console.error(
        "[Geocoding API] No forward geocoding results found from Nominatim"
      );
      throw new Error("No geocoding results found");
    }

    const result = data[0];

    const forwardResult = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
    };

    console.log(
      "[Geocoding API] Nominatim forward geocoding successful:",
      forwardResult
    );

    apiCache.set(cacheKey, forwardResult);

    return forwardResult;
  } catch (error) {
    console.error("[Geocoding API] Forward geocoding error:", error);
    return null;
  }
};
