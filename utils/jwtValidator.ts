import { supabase } from '../supabaseClient';

export interface JWTValidationResult {
  isValid: boolean;
  isExpired: boolean;
  userId?: string;
  error?: string;
}

/**
 * Validates JWT token and checks for expiry
 */
export const validateJWT = async (token: string): Promise<JWTValidationResult> => {
  try {
    if (!token) {
      return {
        isValid: false,
        isExpired: false,
        error: 'No token provided'
      };
    }

    // Extract token from Bearer format
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(cleanToken);

    if (error) {
      return {
        isValid: false,
        isExpired: error.message.includes('expired') || error.message.includes('invalid'),
        error: error.message
      };
    }

    if (!user) {
      return {
        isValid: false,
        isExpired: false,
        error: 'User not found'
      };
    }

    // Check if token is expired by checking the exp claim
    try {
      const payload = JSON.parse(atob(cleanToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        return {
          isValid: false,
          isExpired: true,
          error: 'Token has expired'
        };
      }
    } catch (parseError) {
      return {
        isValid: false,
        isExpired: false,
        error: 'Invalid token format'
      };
    }

    return {
      isValid: true,
      isExpired: false,
      userId: user.id
    };

  } catch (error) {
    return {
      isValid: false,
      isExpired: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Middleware function to validate JWT in requests
 */
export const jwtAuthMiddleware = async (request: Request): Promise<JWTValidationResult> => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return {
      isValid: false,
      isExpired: false,
      error: 'Authorization header missing'
    };
  }

  return await validateJWT(authHeader);
};
