<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AiKnowledgeDocument;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class KnowledgeDocumentController extends Controller
{
    public function upload(Request $request, $companyId)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,xlsx,xls,csv,txt|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        
        // Save file in storage/app/knowledge/{companyId}
        $path = $file->storeAs("knowledge/{$companyId}", $file->getClientOriginalName());

        $doc = AiKnowledgeDocument::create([
            'company_id' => $companyId,
            'filename' => $file->getClientOriginalName(),
            'filepath' => storage_path("app/" . $path),
            'type' => $file->getClientOriginalExtension(),
            'size' => $file->getSize(),
            'status' => 'pending',
        ]);

        // Send to Redis for Python worker
        $payload = [
            'document_id' => $doc->id,
            'company_id' => $companyId,
            'filepath' => $doc->filepath,
            'filename' => $doc->filename,
            'type' => $doc->type,
        ];

        try {
            Redis::lpush('omniflow:ai:process_document', json_encode($payload));
            Log::info("Dispatched document {$doc->id} to AI processing queue");
        } catch (\Exception $e) {
            Log::error("Failed to push document to Redis: " . $e->getMessage());
            $doc->update(['status' => 'error']);
        }

        return response()->json([
            'message' => 'Document uploaded successfully and queued for processing.',
            'document' => $doc
        ], 201);
    }
}
