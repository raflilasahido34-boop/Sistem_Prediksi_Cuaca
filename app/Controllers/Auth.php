<?php

namespace App\Controllers;

class Auth extends BaseController
{
    public function login()
    {
        return view('login');
    }

    public function processLogin()
    {
        $email = $this->request->getPost('email');
        $password = $this->request->getPost('password');

        // Validate credentials
        $userModel = new \App\Models\UserModel();
        $user = $userModel->where('email', $email)->first();

        if ($user && password_verify($password, $user['password'])) {
            session()->set('user_id', $user['id'], 'name', $user['name']);
            return redirect()->to('/');
        }

        return redirect()->back()->with('error', 'Invalid credentials');
    }

    public function logout()
    {
        session()->destroy();
        return redirect()->to('/');
    }

    public function register()
    {
        return view('register');
    }

    public function processRegister()
    {
        $userModel = new \App\Models\UserModel();

        $userModel->save([
            'email' => $this->request->getPost('email'),
            'password' => password_hash($this->request->getPost('password'), PASSWORD_BCRYPT),
            'name' => $this->request->getPost('name')
        ]);

        return redirect()->to('/login')->with('success', 'Registration successful');
    }
}
