<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OnboardingController extends Controller
{
    /**
     * Complete step 2 of onboarding.
     */
    public function complete(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'company_name' => ['required', 'string', 'max:255'],
            'industry' => ['required', 'string', 'max:255'],
            'team_size' => ['required', 'string', 'max:255'],
            'channels' => ['required', 'array'],
            'channels.*' => ['string', 'in:whatsapp,instagram,telegram'],
            'main_goal' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $company = $user->company;

        if (!$company) {
            return response()->json([
                'status' => 'error',
                'message' => 'No associated company found for this user.'
            ], 404);
        }

        $company->update([
            'name' => $request->input('company_name'),
            'industry' => $request->input('industry'),
            'team_size' => $request->input('team_size'),
            'channels' => $request->input('channels'),
            'main_goal' => $request->input('main_goal'),
            'onboarded' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Onboarding completed successfully.',
            'company' => $company
        ]);
    }
}
