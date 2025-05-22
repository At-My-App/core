import { createFetch } from "@better-fetch/fetch";
import { AmaEvent } from "../definitions/AmaEvent";
import { AtMyAppClientOptions } from "./clientTypes";

export interface AnalyticsClient {
  trackEvent<
    Event extends AmaEvent<string, string[]> = AmaEvent<string, string[]>,
  >(
    eventId: Event["ref"]["id"],
    data: Record<Event["ref"]["columns"][number], string> | string[]
  ): Promise<boolean>;
}

export const createAnalyticsClient = (
  clientOptions: AtMyAppClientOptions
): AnalyticsClient => {
  const $fetch = createFetch({
    baseURL: `${clientOptions.baseUrl}/analytics`,
    auth: {
      type: "Bearer",
      token: clientOptions.apiKey,
    },
  });

  const trackEvent = async <Event extends AmaEvent<string, string[]>>(
    eventId: Event["ref"]["id"],
    data: Record<Event["ref"]["columns"][number], string> | string[]
  ) => {
    // Check the number of key-value pairs or array elements
    const dataKeys = Array.isArray(data)
      ? Object.keys(data)
      : Object.keys(data);
    if (dataKeys.length > 20) {
      console.warn(
        `Event "${eventId}": Too many data entries (${dataKeys.length}). Maximum allowed is 20.`
      );
      return false;
    }

    // Calculate the total size of string values in bytes
    let totalSize = 0;
    let dataValuesArray: string[];

    if (Array.isArray(data)) {
      // If data is an array, use the array directly and ensure values are strings
      dataValuesArray = data.map((value) => String(value));
      totalSize = dataValuesArray.reduce(
        (sum, value) => sum + new TextEncoder().encode(value).length,
        0
      );
    } else {
      // If data is a record, sort keys and create an array of values
      const sortedKeys = Object.keys(data).sort();
      dataValuesArray = sortedKeys.map((key) => {
        const typedKey = key as keyof typeof data;
        // Ensure value is a string for size calculation
        const value =
          data[typedKey] !== undefined && data[typedKey] !== null
            ? String(data[typedKey])
            : "";
        totalSize += new TextEncoder().encode(value).length;
        return value;
      });
    }

    // Check the total size of string values
    if (totalSize > 5000) {
      console.warn(
        `Event "${eventId}": Data size (${totalSize} bytes) exceeds the limit of 5000 bytes.`
      );
      return false;
    }

    const response = await $fetch(`/${eventId}`, {
      method: "POST",
      body: {
        // Send the array of values
        blobs: dataValuesArray,
      },
    });

    if (!response.error) {
      return true;
    }

    return false;
  };

  return {
    trackEvent,
  };
};
