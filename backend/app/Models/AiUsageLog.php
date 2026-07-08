<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiUsageLog extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'provider',
        'model',
        'tokens_used',
        'requests_count',
        'estimated_cost',
        'action',
    ];

    protected function casts(): array
    {
        return [
            'tokens_used' => 'integer',
            'requests_count' => 'integer',
            'estimated_cost' => 'decimal:6',
        ];
    }

    /**
     * Calcular si el tenant excedió la cuota mensual de peticiones/mensajes de IA.
     */
    public static function isMonthlyQuotaExceeded(int $companyId, int $maxMessages): bool
    {
        $currentMonthRequests = self::where('company_id', $companyId)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum('requests_count');

        return $currentMonthRequests >= $maxMessages;
    }
}
