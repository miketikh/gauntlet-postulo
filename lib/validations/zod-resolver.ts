import { validateFieldsNatively, toNestErrors } from '@hookform/resolvers';
import { appendErrors, type Resolver } from 'react-hook-form';
import { ZodError, type ZodIssue, type ZodTypeAny } from 'zod';

type ResolverConfig = {
  mode?: 'sync' | 'async';
  raw?: boolean;
};

type IssueWithUnion = ZodIssue & { unionErrors?: ZodError[] };

const isUnionIssue = (issue: ZodIssue): issue is IssueWithUnion =>
  Array.isArray((issue as IssueWithUnion).unionErrors);

function flattenIssues(
  issues: ZodIssue[],
  collectAllFieldCriteria: boolean
) {
  const fieldErrors: Record<string, any> = {};
  const pendingIssues: ZodIssue[] = [...issues];

  while (pendingIssues.length > 0) {
    const issue = pendingIssues.shift()!;
    const path = issue.path ?? [];
    const key = path.length ? path.join('.') : '_root';

    if (!fieldErrors[key]) {
      fieldErrors[key] = { message: issue.message, type: issue.code };
    }

    if (collectAllFieldCriteria) {
      fieldErrors[key] = appendErrors(
        key,
        collectAllFieldCriteria,
        fieldErrors,
        issue.code,
        issue.message
      );
    }

    if (isUnionIssue(issue) && issue.unionErrors) {
      issue.unionErrors.forEach((unionError) => {
        pendingIssues.push(...unionError.issues);
      });
    }
  }

  return fieldErrors;
}

export function zodResolverV4(
  schema: ZodTypeAny,
  _schemaOptions?: unknown,
  resolverConfig: ResolverConfig = {}
): Resolver<any> {
  return async (values, _context, options) => {
    try {
      const parseMethod = resolverConfig.mode === 'sync' ? 'parse' : 'parseAsync';
      const data = await (schema as any)[parseMethod](values);

      if (options.shouldUseNativeValidation) {
        validateFieldsNatively({}, options);
      }

      return {
        values: resolverConfig.raw ? values : data,
        errors: {},
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = flattenIssues(
          error.issues,
          !options.shouldUseNativeValidation && options.criteriaMode === 'all'
        );

        return {
          values: {},
          errors: toNestErrors(fieldErrors, options),
        };
      }

      throw error;
    }
  };
}

