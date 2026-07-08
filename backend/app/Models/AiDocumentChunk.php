<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiDocumentChunk extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'ai_knowledge_document_id',
        'content',
        'embedding',
    ];

    protected $casts = [
        'embedding' => 'array',
    ];

    public function document()
    {
        return $this->belongsTo(AiKnowledgeDocument::class, 'ai_knowledge_document_id');
    }
}
