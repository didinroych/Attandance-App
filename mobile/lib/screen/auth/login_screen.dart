import 'package:flutter/material.dart';
import 'package:mobile/screen/auth/forgot_password_screen.dart';
import 'package:provider/provider.dart';
import 'package:mobile/providers/auth_providers.dart';
// Ganti import register dengan forgot password
import 'package:mobile/widgets/custom_button.dart';
import 'package:mobile/widgets/custom_textfield.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _submit() async {
    // ... (Logika submit login tidak berubah, biarkan sama)
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await Provider.of<AuthProvider>(
        context,
        listen: false,
      ).login(_usernameController.text, _passwordController.text);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst("Exception: ", "");
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.school, size: 80, color: theme.primaryColor),
                const SizedBox(height: 24),
                Text('Selamat Datang', style: theme.textTheme.headlineLarge),
                const SizedBox(height: 8),
                Text('Login ke Akun Anda', style: theme.textTheme.titleMedium),
                const SizedBox(height: 40),

                CustomTextField(
                  controller: _usernameController,
                  hintText: 'Username',
                  prefixIcon: Icons.person_outline,
                  validator: (value) =>
                      value!.isEmpty ? 'Username tidak boleh kosong' : null,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _passwordController,
                  hintText: 'Password',
                  prefixIcon: Icons.lock_outline,
                  isPassword: true,
                  validator: (value) =>
                      value!.isEmpty ? 'Password tidak boleh kosong' : null,
                ),

                // --- PERUBAHAN DI SINI: LUPA PASSWORD ---
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const ForgotPasswordScreen(),
                        ),
                      );
                    },
                    child: const Text('Lupa Kata Sandi?'),
                  ),
                ),

                // ----------------------------------------
                const SizedBox(height: 24),

                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: theme.colorScheme.error),
                      textAlign: TextAlign.center,
                    ),
                  ),

                CustomButton(
                  text: 'Login',
                  isLoading: _isLoading,
                  onPressed: _submit,
                ),

                // --- PERUBAHAN: TOMBOL DAFTAR DIHAPUS ---
                // Karena pendaftaran dikelola admin, bagian ini dihapus.
              ],
            ),
          ),
        ),
      ),
    );
  }
}
