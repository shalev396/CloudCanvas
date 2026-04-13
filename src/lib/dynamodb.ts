import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  BatchGetCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { AwsService, User, CategoryConfig } from "./types";

if (!process.env.AWS_REGION) {
  throw new Error("AWS_REGION environment variable is required");
}
if (!process.env.SERVICES_TABLE_NAME) {
  throw new Error("SERVICES_TABLE_NAME environment variable is required");
}
if (!process.env.USERS_TABLE_NAME) {
  throw new Error("USERS_TABLE_NAME environment variable is required");
}
if (!process.env.CATEGORIES_TABLE_NAME) {
  throw new Error("CATEGORIES_TABLE_NAME environment variable is required");
}

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
});

type ScanInput = ConstructorParameters<typeof ScanCommand>[0];

async function scanAll<T>(input: ScanInput): Promise<T[]> {
  const items: T[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await dynamodb.send(
      new ScanCommand({ ...input, ExclusiveStartKey })
    );
    if (res.Items?.length) items.push(...(res.Items as T[]));
    ExclusiveStartKey = res.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined;
  } while (ExclusiveStartKey);
  return items;
}

const dynamodb = DynamoDBDocumentClient.from(client);

export const TABLES = {
  SERVICES: process.env.SERVICES_TABLE_NAME,
  USERS: process.env.USERS_TABLE_NAME,
  CATEGORIES: process.env.CATEGORIES_TABLE_NAME,
};

// Services operations
export class ServicesDb {
  static async createService(service: AwsService): Promise<void> {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLES.SERVICES,
        Item: service,
      })
    );
  }

  static async getService(id: string): Promise<AwsService | null> {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLES.SERVICES,
        Key: { id },
      })
    );

    return (result.Item as AwsService) || null;
  }

  static async getServiceBySlug(slug: string): Promise<AwsService | null> {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLES.SERVICES,
        FilterExpression: "slug = :slug",
        ExpressionAttributeValues: {
          ":slug": slug,
        },
        Limit: 1,
      })
    );

    return (result.Items?.[0] as AwsService) || null;
  }

  static async getAllServices(): Promise<AwsService[]> {
    return scanAll<AwsService>({ TableName: TABLES.SERVICES });
  }

  static async getServicesByCategory(category: string): Promise<AwsService[]> {
    const services = await scanAll<AwsService>({
      TableName: TABLES.SERVICES,
      FilterExpression: "category = :category",
      ExpressionAttributeValues: { ":category": category },
      ProjectionExpression:
        "id, #name, slug, category, summary, description, markdownContent, awsDocsUrl, diagramUrl, iconPath, enabled, createdAt, updatedAt",
      ExpressionAttributeNames: { "#name": "name" },
    });
    return services.map((s) => ({ ...s, enabled: s.enabled ?? true }));
  }

  static async getServicesByIds(ids: string[]): Promise<AwsService[]> {
    if (ids.length === 0) return [];

    const batchRequests = [];
    // DynamoDB batch get can handle max 100 items at once
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      batchRequests.push(
        dynamodb.send(
          new BatchGetCommand({
            RequestItems: {
              [TABLES.SERVICES]: {
                Keys: batch.map((id) => ({ id })),
              },
            },
          })
        )
      );
    }

    const results = await Promise.all(batchRequests);
    const services: AwsService[] = [];

    for (const result of results) {
      if (result.Responses?.[TABLES.SERVICES]) {
        services.push(...(result.Responses[TABLES.SERVICES] as AwsService[]));
      }
    }

    return services;
  }

  static async updateService(
    id: string,
    updates: Partial<AwsService>
  ): Promise<void> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: {
      [key: string]: string | boolean | number;
    } = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpression.length === 0) return;

    // Always update the updatedAt timestamp
    updateExpression.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    await dynamodb.send(
      new UpdateCommand({
        TableName: TABLES.SERVICES,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  }

  static async deleteService(id: string): Promise<void> {
    await dynamodb.send(
      new DeleteCommand({
        TableName: TABLES.SERVICES,
        Key: { id },
      })
    );
  }

  // Minimal data query for dashboard - only fetch essential fields
  static async getServicesForDashboard(): Promise<Partial<AwsService>[]> {
    const services = await scanAll<Partial<AwsService>>({
      TableName: TABLES.SERVICES,
      ProjectionExpression:
        "id, #name, slug, category, summary, iconPath, enabled, markdownContent, awsDocsUrl, diagramUrl",
      ExpressionAttributeNames: { "#name": "name" },
    });
    return services.map((s) => ({ ...s, enabled: s.enabled ?? true }));
  }

  // Get all services for admin (including disabled ones)
  static async getAllServicesForAdmin(): Promise<Partial<AwsService>[]> {
    const services = await scanAll<Partial<AwsService>>({
      TableName: TABLES.SERVICES,
      ProjectionExpression:
        "id, #name, slug, category, summary, iconPath, enabled, markdownContent, awsDocsUrl, diagramUrl",
      ExpressionAttributeNames: { "#name": "name" },
    });
    return services.map((s) => ({ ...s, enabled: s.enabled ?? true }));
  }
}

// Users operations
export class UsersDb {
  static async createUser(user: User): Promise<void> {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: user,
        ConditionExpression: "attribute_not_exists(id)", // Prevent overwriting existing user
      })
    );
  }

  static async getUser(id: string): Promise<User | null> {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLES.USERS,
        Key: { id },
      })
    );

    return (result.Item as User) || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLES.USERS,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
        Limit: 1,
      })
    );

    return (result.Items?.[0] as User) || null;
  }

  static async updateUserFavorites(
    userId: string,
    favorites: string[]
  ): Promise<void> {
    await dynamodb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { id: userId },
        UpdateExpression: "SET favorites = :favorites, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":favorites": favorites,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: {
      [key: string]: string | boolean | string[];
    } = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpression.length === 0) return;

    // Always update the updatedAt timestamp
    updateExpression.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    await dynamodb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  }

  static async deleteUser(id: string): Promise<void> {
    await dynamodb.send(
      new DeleteCommand({
        TableName: TABLES.USERS,
        Key: { id },
      })
    );
  }
}

// Categories operations
export class CategoriesDb {
  static async getAllCategories(): Promise<CategoryConfig[]> {
    return scanAll<CategoryConfig>({ TableName: TABLES.CATEGORIES });
  }

  static async upsertCategory(category: CategoryConfig): Promise<void> {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLES.CATEGORIES,
        Item: category,
      })
    );
  }

  static async clearAllCategories(): Promise<void> {
    const categories = await CategoriesDb.getAllCategories();
    const batchSize = 25;
    for (let i = 0; i < categories.length; i += batchSize) {
      const batch = categories.slice(i, i + batchSize);
      const deleteRequests = batch.map((cat) => ({
        DeleteRequest: { Key: { id: cat.id } },
      }));
      if (deleteRequests.length > 0) {
        await dynamodb.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLES.CATEGORIES]: deleteRequests,
            },
          })
        );
      }
    }
  }
}

// Batch operations for seeding
export class BatchOperations {
  static async batchCreateServices(services: AwsService[]): Promise<void> {
    const batchSize = 25; // DynamoDB batch write limit

    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize);

      const writeRequests = batch.map((service) => ({
        PutRequest: {
          Item: service,
        },
      }));

      await dynamodb.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLES.SERVICES]: writeRequests,
          },
        })
      );
    }
  }

  static async clearAllServices(): Promise<void> {
    const services = await ServicesDb.getAllServices();

    const batchSize = 25;
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize);

      const deleteRequests = batch.map((service) => ({
        DeleteRequest: {
          Key: { id: service.id },
        },
      }));

      if (deleteRequests.length > 0) {
        await dynamodb.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLES.SERVICES]: deleteRequests,
            },
          })
        );
      }
    }
  }
}
