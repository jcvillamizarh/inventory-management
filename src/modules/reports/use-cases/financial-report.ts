import { z } from 'zod';
import type { IReportsRepository } from '../reports.repository.js';

const financialReportSchema = z.object({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
});

export class FinancialReportUseCase {
  constructor(private readonly reportsRepository: IReportsRepository) {}

  async execute(startDate: Date, endDate: Date) {
    // Validate dates
    if (startDate > endDate) {
      throw {
        statusCode: 400,
        message: 'Start date must be before or equal to end date',
      };
    }

    const report = await this.reportsRepository.getFinancialReport(startDate, endDate);

    return {
      statusCode: 200,
      data: report,
    };
  }
}
