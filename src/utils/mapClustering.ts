import { Trip, ClusteredMarker, MapRegion } from "../lib/types/trip";

export interface ClusteringConfig {
  clusterDistance: number;
  minClusterSize: number;
  maxZoomLevel: number;
  enableClustering: boolean;
}

const DEFAULT_CONFIG: ClusteringConfig = {
  clusterDistance: 0.01,
  minClusterSize: 2,
  maxZoomLevel: 0.005,
  enableClustering: true,
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
};

export const shouldEnableClustering = (
  region: MapRegion,
  config: ClusteringConfig = DEFAULT_CONFIG
): boolean => {
  if (!config.enableClustering) return false;

  return region.latitudeDelta > config.maxZoomLevel;
};

export const clusterTrips = (
  trips: Trip[],
  region: MapRegion,
  config: ClusteringConfig = DEFAULT_CONFIG
): ClusteredMarker[] => {
  if (!trips.length) return [];

  const visibleTrips = trips.filter((trip) => {
    if (!trip.location?.latitude || !trip.location?.longitude) return false;

    const { latitude, longitude } = trip.location;
    const buffer = 0.1;

    return (
      latitude >= region.latitude - region.latitudeDelta / 2 - buffer &&
      latitude <= region.latitude + region.latitudeDelta / 2 + buffer &&
      longitude >= region.longitude - region.longitudeDelta / 2 - buffer &&
      longitude <= region.longitude + region.longitudeDelta / 2 + buffer
    );
  });

  if (!shouldEnableClustering(region, config)) {
    return visibleTrips.map((trip) => ({
      id: trip.id || `trip_${Date.now()}_${Math.random()}`,
      latitude: trip.location.latitude,
      longitude: trip.location.longitude,
      trips: [trip],
      averageRating: trip.rating || 0,
      isCluster: false,
    }));
  }

  const clusters: ClusteredMarker[] = [];
  const processedTrips = new Set<string>();

  visibleTrips.forEach((trip) => {
    const tripId =
      trip.id ||
      `${trip.location.latitude}_${trip.location.longitude}_${trip.timestamp}`;

    if (processedTrips.has(tripId)) return;

    const nearbyTrips = visibleTrips.filter((otherTrip) => {
      const otherTripId =
        otherTrip.id ||
        `${otherTrip.location.latitude}_${otherTrip.location.longitude}_${otherTrip.timestamp}`;

      if (processedTrips.has(otherTripId)) return false;

      const distance = calculateDistance(
        trip.location.latitude,
        trip.location.longitude,
        otherTrip.location.latitude,
        otherTrip.location.longitude
      );

      return distance <= config.clusterDistance;
    });

    nearbyTrips.forEach((nearbyTrip) => {
      const nearbyTripId =
        nearbyTrip.id ||
        `${nearbyTrip.location.latitude}_${nearbyTrip.location.longitude}_${nearbyTrip.timestamp}`;
      processedTrips.add(nearbyTripId);
    });

    const totalWeight = nearbyTrips.reduce(
      (sum, t) => sum + (t.rating || 1),
      0
    );
    const centerLat =
      nearbyTrips.reduce(
        (sum, t) => sum + t.location.latitude * (t.rating || 1),
        0
      ) / totalWeight;
    const centerLng =
      nearbyTrips.reduce(
        (sum, t) => sum + t.location.longitude * (t.rating || 1),
        0
      ) / totalWeight;

    const ratingsArray = nearbyTrips
      .filter((t) => t.rating)
      .map((t) => t.rating!);
    const averageRating =
      ratingsArray.length > 0
        ? ratingsArray.reduce((sum, rating) => sum + rating, 0) /
          ratingsArray.length
        : 0;

    clusters.push({
      id: `cluster_${centerLat.toFixed(6)}_${centerLng.toFixed(6)}`,
      latitude: centerLat,
      longitude: centerLng,
      trips: nearbyTrips,
      averageRating,
      isCluster: nearbyTrips.length >= config.minClusterSize,
      clusterSize: nearbyTrips.length,
    });
  });

  return clusters;
};

export const getClusterStats = (clusters: ClusteredMarker[]) => {
  const totalTrips = clusters.reduce(
    (sum, cluster) => sum + cluster.trips.length,
    0
  );
  const clusterCount = clusters.filter((cluster) => cluster.isCluster).length;
  const individualCount = clusters.filter(
    (cluster) => !cluster.isCluster
  ).length;
  const largestCluster = Math.max(
    ...clusters.map((cluster) => cluster.trips.length)
  );

  return {
    totalTrips,
    totalMarkers: clusters.length,
    clusterCount,
    individualCount,
    largestCluster,
    compressionRatio: totalTrips > 0 ? clusters.length / totalTrips : 0,
  };
};

export const filterClustersByRating = (
  clusters: ClusteredMarker[],
  minRating: number = 0,
  maxRating: number = 5
): ClusteredMarker[] => {
  return clusters.filter(
    (cluster) =>
      cluster.averageRating >= minRating && cluster.averageRating <= maxRating
  );
};

export const filterClustersByDate = (
  clusters: ClusteredMarker[],
  startDate?: Date,
  endDate?: Date
): ClusteredMarker[] => {
  if (!startDate && !endDate) return clusters;

  return clusters
    .map((cluster) => ({
      ...cluster,
      trips: cluster.trips.filter((trip) => {
        const tripDate = trip.tripDate
          ? new Date(trip.tripDate)
          : new Date(trip.timestamp);

        if (startDate && tripDate < startDate) return false;
        if (endDate && tripDate > endDate) return false;

        return true;
      }),
    }))
    .filter((cluster) => cluster.trips.length > 0);
};

export const sortClusters = (
  clusters: ClusteredMarker[],
  sortBy: "rating" | "size" | "recent" = "rating"
): ClusteredMarker[] => {
  return [...clusters].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.averageRating - a.averageRating;

      case "size":
        return b.trips.length - a.trips.length;

      case "recent":
        const aLatest = Math.max(
          ...a.trips.map((trip) =>
            new Date(trip.tripDate || trip.timestamp || 0).getTime()
          )
        );
        const bLatest = Math.max(
          ...b.trips.map((trip) =>
            new Date(trip.tripDate || trip.timestamp || 0).getTime()
          )
        );
        return bLatest - aLatest;

      default:
        return 0;
    }
  });
};

export const getOptimalZoomLevel = (
  trips: Trip[],
  mapDimensions: { width: number; height: number }
): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} => {
  if (!trips.length) {
    return {
      latitude: 22.3193,
      longitude: 114.1694,
      latitudeDelta: 0.3,
      longitudeDelta: 0.3,
    };
  }

  const latitudes = trips.map((trip) => trip.location.latitude);
  const longitudes = trips.map((trip) => trip.location.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const latDelta = (maxLat - minLat) * 1.2;
  const lngDelta = (maxLng - minLng) * 1.2;

  const minDelta = 0.01;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDelta, minDelta),
    longitudeDelta: Math.max(lngDelta, minDelta),
  };
};
