<?php

namespace App\Controllers;

class TreeUpload extends BaseController
{
    public function upload()
    {
        $file = $this->request->getFile('tree_file');

        if (!$file || !$file->isValid()) {
            return redirect()->back()->with('error', 'File tidak valid');
        }

        if ($file->getClientExtension() !== 'json') {
            return redirect()->back()->with('error', 'File harus JSON');
        }

        // ✅ Simpan sebagai tree.json (overwrite)
        $file->move(ROOTPATH . 'public/data', 'tree.json', true);

        return redirect()->to('/')->with('success', 'Tree berhasil diupload');
    }
}
