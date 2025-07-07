import { APIGatewayProxyHandler } from "aws-lambda";
import { SupabaseClientRepository } from "../database/SupabaseClientRepository";
import { SupabaseDocumentRepository } from "../database/SupabaseDocumentRepository";
import { GetExpirations } from "../../application/use-cases/GetExpirations";
import { PeriodType } from "../../domain/entities/ExpirationResult";

const clientRepository = new SupabaseClientRepository();
const documentRepository = new SupabaseDocumentRepository();
const getExpirations = new GetExpirations(clientRepository, documentRepository);

export const expirationsHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const { period = 'week', date } = queryParams;

    // Validar tipo de período
    if (!Object.values(PeriodType).includes(period as PeriodType)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({ 
          message: "Parámetro 'period' debe ser 'week' o 'month'" 
        }),
      };
    }

    // Procesar fecha de referencia si se proporciona
    let referenceDate: Date | undefined;
    if (date) {
      referenceDate = new Date(date);
      if (isNaN(referenceDate.getTime())) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, OPTIONS'
          },
          body: JSON.stringify({ 
            message: "Formato de fecha inválido. Use YYYY-MM-DD" 
          }),
        };
      }
    }

    const result = await getExpirations.execute(period as PeriodType, referenceDate);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: result,
        summary: {
          birthdaysCount: result.upcomingBirthdays.length,
          documentsCount: result.expiringDocuments.length,
          period: result.period,
          periodType: result.periodType
        }
      }),
    };
  } catch (error) {
    console.error('Error in expirationsHandler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ 
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
    };
  }
};
