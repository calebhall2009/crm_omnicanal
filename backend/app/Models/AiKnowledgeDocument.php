<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiKnowledgeDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'filename',
        'filepath',
        'type',
        'size',
        'status',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function chunks()
    {
        return $this->hasMany(AiDocumentChunk::class);
    }
}
